function validateStudent(){

let inputs = document.querySelectorAll("input");

for(let i of inputs){
if(i.value.trim()===""){
alert("Please fill all fields");
return false;
}
}

return true;
}
