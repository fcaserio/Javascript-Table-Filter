# Javascript-Table-FIlter
Excel Like Table Filter By Header 

Add Excel Like Filter Selects do any HTML table with easy steps
1. Initialize your table: 
var tblAdm = new setupFilter(document.querySelector('TABLE'));
2. Add N Columns
tblAdm.addCol('Column name', 'Child Name optional', cfg); // cfg supports { maxWidth:int, default:string, format:funtion(elm) { return string or array }, sort:funtion(a,b) { return boolean; } }
3. Apply Filter
tblAdm.apply();
