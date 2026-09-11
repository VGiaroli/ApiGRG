function verificarUsuario() {
    const token = getToken();
    const email = localStorage.getItem("email");
    document.getElementById("email-usuario").textContent = email;

    if (!token) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        window.location.href = "/views/Usuarios/login.html";
        return;
    }
}

async function cerrarSesion() {
    const token = getToken();
    const email = localStorage.getItem("email");

    if (!token || !email) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        window.location.href = "/views/Usuarios/login.html";
        return;
    }

    const apiBase = `${linkApi}/auth`;
    try {
        const res = await fetch(`${apiBase}/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email })
        });

        if (res.ok) {
            //alert("Sesión cerrada correctamente");
        } else {
            alert("Error al cerrar sesión: " + await res.text());
        }
    } catch (error) {
        console.error("Error en logout:", error);
    }

    // Limpiar token y redirigir
    localStorage.removeItem("token");
    localStorage.removeItem("email");

    window.location.href = "/views/Usuarios/login.html";
}

