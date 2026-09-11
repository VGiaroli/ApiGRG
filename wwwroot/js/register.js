document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        nombreCompleto: document.getElementById("nombre").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };
    const apiBase = `${linkApi}/auth`;
    const response = await fetch(`${apiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await response.text();
    if (response.ok) {
        alert(result);
        window.location.href = "../../views/usuarios/login.html";
    } else {
        alert("Register fallido");
    }
    
    
});