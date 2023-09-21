/*
setupFilter
author Francisco Caserio - francisco.caserio@gmail.com
versao 2.1 - 21/09/2023
*/
function setupFilter(src,ck_apply) {
	if (typeof src == "string") var src = document.getElementById(src);
	if (src.nodeName == "THEAD" || src.nodeName == "TABLE") src = src.getElementsByTagName("TR")[0];
	this.srcRow = src;
	this.rowPrefix = false;
	this.dstMask = false;
	this.cols = [];
	this.totals = [];
	this.log = {};
	if (ck_apply) this.apply();
}
setupFilter.prototype.setRowPrefix = function(str) {
	this.rowPrefix = str;
}
setupFilter.prototype.setCols = function(cols) {
	var parts = cols.split(",");
	for (var i=0; i<parts.length; i++) {
		this.addCol(parts[i]);
	}
}
//setupFilter.prototype.addCol = function(col, children, sort, default) {
setupFilter.prototype.addCol = function(col, children, params) {
	if (typeof params == "function") params = { sort: params } // compatibility
	if (!params) params = {};
	if (!("sort" in params)) params.sort = false;
	if (!("format" in params)) params.format = false;
	if (!("default" in params)) params.default = false;
	var cells = this.srcRow.querySelectorAll("TD,TH");
	var cfg = { title: this.getPosTitle(col), col: this.getSpanTitle(col), label: col };
	for (ix in params) cfg[ix] = params[ix];
	if (children) {
		if (typeof children == "string") var children = [children];
		var cfgChildren = [];
		for (var child of children) {
			/* var pChild = -1;
			for (var i=0; i<cells.length; i++) {
				if (cells[i].innerHTML == child) {
					var pChild = i; break;
				}
			}
			cfgChildren.push(pChild);*/
			var paramsChild = { title: this.getPosTitle(child), col: this.getSpanTitle(child) };
			if (params.maxWidth) paramsChild.maxWidth = params.maxWidth;
			cfgChildren.push(paramsChild);
		}
		cfg.children = cfgChildren;
	}
	if (params.sort) cfg.sort = params.sort;
	this.cols.push(cfg);
}
setupFilter.prototype.addTotals = function(src,cols,cmd) {
	if (typeof src == "string") var src = document.getElementById(src);
	for (var col of cols) {
		this.addColTotal(src, col);
	}
	this.filterCmd = cmd;
}
setupFilter.prototype.addColTotal = function(src,col) {
	var pTitle = this.getSpanTitle(col), p = 0;
	for (var cell of src.querySelectorAll("TD,TH")) {
		if (p == pTitle) break;
		p += cell.colSpan;
	}
	this.totals.push({ p: pTitle, cell: cell });
}
setupFilter.prototype.getFilter = function(src) {
	for (var col of this.cols) {
		if (col.label == src) return col.filter;
	}
}
setupFilter.prototype.getPosTitle = function(col) {
	var p = 0;
	for (var cell of this.srcRow.querySelectorAll("TD,TH")) {
		if (cell.innerHTML == col) break;
		p++;
	}
	return p;
}
setupFilter.prototype.getSpanTitle = function(col) {
	var p = 0;
	for (var cell of this.srcRow.querySelectorAll("TD,TH")) {
		if (cell.innerHTML == col) break;
		p += cell.colSpan;
	}
	return p;
}
setupFilter.prototype.getSelectedRows = function() {
	var sel = [];
	for (var row of this.dstRows) {
		if (row.style.display != "none") sel.push(row);
	}
	return sel;
}
setupFilter.prototype.setDst = function(dst) {
	this.dstMask = dst;
}
setupFilter.prototype.apply = function() {
	// find table
	var obj = this.srcRow;
	while (obj.parentNode && obj.tagName != "TABLE") {
		obj = obj.parentNode;
	}
	// find affected rows
	this.dstRows = [];
	var srcPattern = 0;
	var rows = obj.getElementsByTagName("TR");
	for (var i=0; i<rows.length; i++) {
		if (srcPattern && (!this.rowPrefix || rows[i].id.substr(0,this.rowPrefix.length) == this.rowPrefix)) {
			// if (rows[i].style.display != "none" && srcPattern > rows[i].querySelectorAll("TD,TH").length) break; // break if row length is not compatible to srcRow
			if (rows[i].style.display != "none" && rows[i].querySelectorAll("TD,TH").length >= srcPattern) {
				var ck_match = 0;
				if (!this.dstMask) {
					var ck_match = 1;
				} else if (this.dstMask && rows[i].id.length > 0) {
					var regex = new RegExp(this.dstMask);
					var res = rows[i].id.match(regex);
					if (res != null && res[0] == rows[i].id) var ck_match = 1;
				}
				if (ck_match == 1) this.dstRows.push(rows[i]);
			}
		}
		// if (srcPattern && this.srcRow.id && rows[i].id == this.srcRow.id) break;
		if (rows[i] == this.srcRow) var srcPattern = this.srcRow.querySelectorAll("TD,TH").length;
	}
	// apply actions
	for (var col of this.cols) {
		this.cfgSearchForm(col, true);
		if ("children" in col) {
			for (var cfg of col.children) this.cfgSearchForm(cfg, false);
		}
	}
}
setupFilter.prototype.cfgSearchForm = function(cfg, ck_load) {
	var children = "children" in cfg ? cfg.children : false;
	var th = this;
	var cell = this.srcRow.querySelectorAll("TD,TH")[cfg.title];
	cfg.filter = document.createElement("SELECT");
	cfg.filter.id = "search" + cfg.col;
	cfg.filter.className = "formpeq";
	cfg.filter.style.maxWidth = cfg.maxWidth ? cfg.maxWidth + "px" : "150px";
	cfg.filter.onchange = function () {
		th.search();
		// Update child filters
		if ("children" in cfg) {
			for (var child of children) {
				if (this.value == "__nosearch__")
					th.resetSearchForm(child);
				else
					th.loadSearchForm(child.col, child);
			}
		}
		// Check how many filters are applied
		var selected = [];
		for (var col of th.cols) {
			if (col.filter.value != "__nosearch__") selected.push(col.col);
		}
		// Update all filters according to selection, if only 1 filter is selected display all options available
		for (var col of th.cols) {
			var searchHidden = (selected.length == 1 && col.col == selected[0]);
			th.loadSearchForm(col.col, cloneObj(col), searchHidden);
		}
		if (cfg.cmd) cfg.cmd(this);
	};
	var _option = document.createElement("OPTION");
	_option.value = "__nosearch__";
	_option.text = cell.innerHTML + "";
	_option.style.fontWeight = "bold";
	cfg.filter.appendChild(_option);
	if (ck_load) {
		var r = this.loadSearchForm(cfg.col, cfg);
		if (r.length == 1 && r[0] == "__nosearch__") return;
	}
	cell.innerHTML = "";
	cell.appendChild(cfg.filter);
}
setupFilter.prototype.loadSearchForm = function(col, cfg, searchHidden) {
	if (typeof cfg == "undefined") var cfg = { filter: document.getElementById("search"+col) };
	var curVal = cfg.filter.value;
	this.resetSearchForm(col);
	var opt = [], tot = {};
	for (var elm of this.dstRows) {
		if (!isHidden(elm) || searchHidden) {
			var cell = elm.querySelectorAll("TD,TH")[col];
			if (cfg.format) 
				val = cfg.format(cell);
			else
				var val = cell.innerText;
			if (cfg.sep) var val = val.split(cfg.sep);
			if (Array.isArray(val))
				var vals = val.map(function(s) { return s.trim(); });
			else
				var vals = [ val ];
			for (var val of vals) {
				if (opt.indexOf(val) < 0) opt.push(val);
				if (!(val in tot)) tot[val] = 0;
				tot[val]++;
			}
		}
	}
	if (cfg.sort)
		opt.sort(cfg.sort);
	else
		opt.sort();
	for (var val of opt) {
		var _option = document.createElement("OPTION");
		_option.value = val;
		_option.text = (val != "" ? val : "N/A") + " (" + tot[val] + ")";
		cfg.filter.appendChild(_option);
		if (val === curVal || val === cfg.default) _option.selected = true;
	}
	if (cfg.default) this.search();
	return opt;
}
setupFilter.prototype.resetSearchForm = function(col) {
	if (document.getElementById("search" + col)) {
		var _select = document.getElementById("search" + col);
		for (var i=_select.length-1; i>=1; i--) {
			_select.remove(i);
		}
	}
}
setupFilter.prototype.search = function() {
	for (var elm of this.dstRows) {
		elm.style.display = "";
	}
	for (cfg of this.cols) {
		this.filter(cfg.col);
		if ("children" in cfg) {
			for (var child of cfg.children) this.filter(child.col);
		}
	}
}
setupFilter.prototype.filter = function(col) {
	for (cfg of this.cols) {
		if (cfg.col == col) break;
	}
	if (document.getElementById("search"+col)) {
		var query = document.getElementById("search"+col).value;
		if (query != "__nosearch__") {
			for (var elm of this.dstRows) {
				var cell = elm.querySelectorAll("TD,TH")[col];
				if (cfg.format) 
					val = cfg.format(cell);
				else
					var val = cell.innerText;
				if (cfg.sep) var val = val.split(cfg.sep);
				if (Array.isArray(val))
					var vals = val.map(function(s) { return s.trim(); });
				else
					var vals = [ val ];
				if (vals.indexOf(query) < 0) elm.style.display = "none";
			}
		}
		this.updTotals();
	}
}
setupFilter.prototype.updTotals = function() {
	for (var item of this.totals) {
		item.total = 0;
		for (var row of this.getSelectedRows()) {
			item.total += getVal(row.querySelectorAll("TD,TH")[item.p].innerHTML);
		}
		item.cell.innerHTML = formatnum(item.total,2,".",",");
	}
	if (this.filterCmd) this.filterCmd(this.totals);
}
function isHidden(el) {
	return (el.offsetParent === null);
}
function cloneObj(obj) {
	var ret = {};
	for (var ix in obj) ret[ix] = obj[ix];
	return ret;
}