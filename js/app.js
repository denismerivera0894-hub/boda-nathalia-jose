
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

         window.invitadoActual = data;

    if (error) {

        document.getElementById("datosInvitado").innerHTML = `
            <p style="margin-top:20px;color:red;">
                Invitación no encontrada
            </p>
        `;

        return;
    }

    let camposAcompanantes = "";

for(let i = 1; i < data.cupos; i++){

    camposAcompanantes += `
        <div style="margin-top:15px">
            <label>
                Acompañante ${i}
            </label>

            <input
                type="text"
                id="acompanante${i}"
                style="
                    width:100%;
                    padding:10px;
                    margin-top:5px;
                "
            >
        </div>
    `;
}

    if(data.confirmado){

        const fecha = new Date(
    data.fecha_confirmacion
).toLocaleString("es-HN");

    document.getElementById("datosInvitado").innerHTML = `

<div style="
    margin-top:30px;
    padding:25px;
    background:white;
    border-radius:12px;
    max-width:500px;
    margin-left:auto;
    margin-right:auto;
    text-align:center;
">

    <h2 style="color:#7B1830;">
        ✅ Asistencia confirmada
    </h2>

    <h3>
        ${data.nombre}
    </h3>

    <p>
        Gracias por confirmar tu asistencia.
    </p>

    ${listaAcompanantes}

    <p>
        Confirmado el:
        <br>
        <strong>${fecha}</strong>
    </p>

</div>
`;

    return;
}

    const { data: acompanantes } = await supabaseClient
    .from("acompanantes")
    .select("nombre")
    .eq("invitado_id", data.id);

    let listaAcompanantes = "";

if(acompanantes && acompanantes.length > 0){

    listaAcompanantes = `
        <div style="margin-top:20px;">
            <h4>Acompañantes registrados</h4>

            ${acompanantes.map(a => `
                <p>• ${a.nombre}</p>
            `).join("")}
        </div>
    `;
}
    

document.getElementById("datosInvitado").innerHTML = `

<div style="
    margin-top:30px;
    padding:20px;
    background:white;
    border-radius:12px;
    max-width:450px;
    margin-left:auto;
    margin-right:auto;
">

    <h2>Bienvenido</h2>

    <p>${data.nombre}</p>

    <p>
        Cupos asignados:
        ${data.cupos}
    </p>

    ${camposAcompanantes}

    <button
        onclick="confirmarAsistencia()"
        class="btn"
        style="margin-top:20px;"
    >
        Confirmar asistencia
    </button>

</div>
`;
}

cargarInvitado();

async function confirmarAsistencia(){

    const { data: invitadoActual } = await supabaseClient
    .from("invitados")
    .select("confirmado")
    .eq("codigo", codigo)
    .single();

if(invitadoActual.confirmado){

    alert("Esta invitación ya fue confirmada.");

    return;
}

    let acompanantesVacios = 0;

    const card = document.getElementById("datosInvitado");

    const inputs = card.querySelectorAll('input[id^="acompanante"]');

    inputs.forEach(input => {

        if(input.value.trim() === ""){
            acompanantesVacios++;
        }

    });

    if(acompanantesVacios > 0){

        const continuar = confirm(
            `No ha registrado todos los acompañantes.

Si confirma ahora, posteriormente no podrá agregar más personas.

¿Desea continuar?`
        );

        if(!continuar){
            return;
        }
    }

    const invitado = window.invitadoActual;

    const { error:updateError } = await supabaseClient
        .from("invitados")
        .update({
            confirmado:true,
            fecha_confirmacion:new Date().toISOString()
        })
        .eq("id", invitado.id);

    if(updateError){

        alert("Error actualizando invitado");

        console.error(updateError);

        return;
    }

    for(const input of inputs){

        const nombre = input.value.trim();

        if(nombre === ""){
            continue;
        }

        const { error:acompError } =
            await supabaseClient
            .from("acompanantes")
            .insert({
                invitado_id: invitado.id,
                nombre: nombre
            });

        if(acompError){

            console.error(acompError);

            alert(
                "Error guardando acompañantes"
            );

            return;
        }
    }

    alert(
        "🎉 Gracias por confirmar tu asistencia."
    );

}
