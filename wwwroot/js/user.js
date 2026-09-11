// document.getElementById("loginForm").addEventListener("submit", async (e) => {
//     e.preventDefault();
//     const data = {
//         email: document.getElementById("loginEmail").value,
//         password: document.getElementById("loginPassword").value
//     };
//     const apiBase = `${linkApi}/auth`;

//     try {

//         fetch(`${apiBase}/login`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify(data)
//         })
//             .then(response => {
//                 if (!response.ok) {
//                     throw new Error(`Error en la petición: ${response.status}`);
//                 }

//                 return response.json();
//             })
//             .then(result => {
//                 localStorage.setItem("token", result.token);
//                 localStorage.setItem("refreshToken", result.refreshToken);
//                 localStorage.setItem("email", data.email);

//                 window.location.href = "../index.html";
//             })
//             .catch(error => {
//                 console.error(error);
//             });

//     } catch (error) {
//         //alert("No conecta: " + error.message);
//         document.getElementById("tokenOutput").textContent = "No conecta a la API";
//     }
// });

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const errorContainer = document.getElementById("tokenOutput");
    errorContainer.textContent = ""; // Limpiar errores previos

    const data = {
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value
    };

    const apiBase = `${linkApi}/auth`;

    try {
        const response = await fetch(`${apiBase}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // if (!response.ok) {
        //     // Si la API devuelve un status distinto a 2xx (ej. 401)
        //     // Mostramos el mensaje que nos mandó el backend
        //     throw new Error(result.message || "Error al iniciar sesión");
        // }

        // Validamos si la autenticación falló según nuestra respuesta de la API
        if (!result.success) {
            errorContainer.textContent = result.message;
            return;
        }

        // Si el login es exitoso (200 OK)
        localStorage.setItem("token", result.token);
        localStorage.setItem("refreshToken", result.refreshToken);
        localStorage.setItem("email", data.email);

        window.location.href = "/index.html";

    } catch (error) {
        // Captura tanto errores de red como el throw new Error del response.ok
        //console.error("Error en login:", error);
        //errorContainer.textContent = error.message;
        // Solo entra aquí si hay un corte real de red o la API no está disponible
        errorContainer.textContent = "No fue posible conectar con el servidor";
    }
});

function getToken() {
    return localStorage.getItem("token");
}

async function Migrar() {
    const apiBase = `${linkApi}/auth`;
    const response = await fetch(`${apiBase}`);
    const result = await response.json();
    console.log(result);
}
