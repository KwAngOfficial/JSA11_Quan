document.getElementById("registerForm").addEventListener("submit",function(e){

e.preventDefault()

const user=document.getElementById("username").value
const pass=document.getElementById("password").value

const account={
username:user,
password:pass
}

localStorage.setItem("account",JSON.stringify(account))



window.location.href="login.html"

})