# Javascript-Table-FIlter
Excel Like Table Filter By Header 

Add Excel Like Filter Selects do any HTML table with easy steps
1. Initialize your table:
var tblAdm = new setupFilter(document.querySelector('TABLE'));
3. Add N Columns:
tblAdm.addCol('column name', 'child column', cfg);
/*
child column, cfg optional;
cfg supports {
  maxWidth:int,
  default:string,
  format:function(elm) { return string or array },
  sort:function(a,b) { return boolean; } }
*/
5. Apply Filter:
tblAdm.apply();
