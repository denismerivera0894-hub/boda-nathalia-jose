
const params = new URLSearchParams(window.location.search);

const codigo = params.get("codigo");

async function cargarInvitado() {

    if (!codigo) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("invitados")
        .select("*")
        .eq("codigo", codigo)
        .single();

    if (error) {

        document.getElementById("datosInvitado").innerHTML = `
            <p style="margin-top:20px;color:red;">
                Invitación no encontrada
            </p>
        `;

        return;
    }

    document.getElementById("datosInvitado").innerHTML = `
        <div style="
            margin-top:30px;
            padding:20px;
            background:white;
            border-radius:12px;
            max-width:400px;
            margin-left:auto;
            margin-right:auto;
        ">

            <h3>Bienvenido</h3>

            <p>${data.nombre}</p>

            <p>Cupos asignados: ${data.cupos}</p>

        </div>
    `;
}

cargarInvitado();
