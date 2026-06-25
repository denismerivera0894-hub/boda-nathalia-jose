/********************************************************************
 * APP.JS
 * Proyecto: Invitación Digital
 * Novios: José & Regina
 * Versión: 2.0
 ********************************************************************/


/********************************************************************
 * VARIABLES GLOBALES
 ********************************************************************/

const params = new URLSearchParams(window.location.search);

const codigo = params.get("codigo");

const App = {

    invitado:null,

    acompanantes:[],

    codigo:codigo

};


/********************************************************************
 * INICIAR APLICACIÓN
 ********************************************************************/

window.addEventListener("DOMContentLoaded",()=>{

    cargarInvitado();

});


/********************************************************************
 * CARGAR INVITADO
 ********************************************************************/

async function cargarInvitado(){

    if(!App.codigo){

        document.getElementById("datosInvitado").innerHTML=`

            <p style="color:red">

                Invitación inválida

            </p>

        `;

        return;

    }


    /***************************************************************
     * BUSCAR INVITADO
     ***************************************************************/

    const {

        data,

        error

    }=await supabaseClient

        .from("invitados")

        .select("*")

        .eq("codigo",App.codigo)

        .single();


    if(error){

        console.error(error);

        document.getElementById("datosInvitado").innerHTML=`

            <p style="color:red">

                Invitación no encontrada

            </p>

        `;

        return;

    }


    App.invitado=data;


    /***************************************************************
     * CARGAR ACOMPAÑANTES
     ***************************************************************/

    const {

        data:acompanantes

    }=await supabaseClient

        .from("acompanantes")

        .select("*")

        .eq("invitado_id",App.invitado.id)

        .order("created_at");


    App.acompanantes=acompanantes||[];


    /***************************************************************
     * SI YA CONFIRMÓ
     ***************************************************************/

    if(App.invitado.confirmado){

        mostrarConfirmacion();

        return;

    }


    /***************************************************************
     * MOSTRAR FORMULARIO
     ***************************************************************/

    mostrarFormulario();

}

/********************************************************************
 * MOSTRAR FORMULARIO
 ********************************************************************/

function mostrarFormulario(){

    let camposAcompanantes="";

    for(let i=1;i<App.invitado.cupos;i++){

        camposAcompanantes+=`

            <div style="margin-top:15px">

                <label>

                    Acompañante ${i}

                </label>

                <input

                    id="acompanante${i}"

                    type="text"

                    style="
                        width:100%;
                        padding:10px;
                        margin-top:5px;
                    "

                >

            </div>

        `;

    }

    document.getElementById("datosInvitado").innerHTML=`

<div style="
    margin-top:30px;
    padding:20px;
    background:white;
    border-radius:12px;
    max-width:500px;
    margin:auto;
">

    <h2>

        Bienvenido

    </h2>

    <h3>

        ${App.invitado.nombre}

    </h3>

    <p>

        Cupos asignados:
        <strong>${App.invitado.cupos}</strong>

    </p>

    ${camposAcompanantes}

    <button

        class="btn"

        style="margin-top:20px"

        onclick="confirmarAsistencia()"

    >

        Confirmar asistencia

    </button>

</div>

`;

}


/********************************************************************
 * MOSTRAR CONFIRMACIÓN
 ********************************************************************/

function mostrarConfirmacion(){

    const fecha=new Date(

        App.invitado.fecha_confirmacion

    ).toLocaleString("es-HN");


    let lista="";


    if(App.acompanantes.length>0){

        lista=`

        <div style="margin-top:20px">

            <h4>

                Acompañantes registrados

            </h4>

            ${App.acompanantes.map(persona=>`

                <p>

                    • ${persona.nombre}

                </p>

            `).join("")}

        </div>

        `;

    }


    document.getElementById("datosInvitado").innerHTML=`

<div style="
    margin-top:30px;
    padding:25px;
    background:white;
    border-radius:12px;
    max-width:550px;
    margin:auto;
    text-align:center;
">

    <h2 style="color:#7B1830">

        ✅ Asistencia confirmada

    </h2>

    <h3>

        ${App.invitado.nombre}

    </h3>

    <p>

        Gracias por confirmar tu asistencia.

    </p>

    ${lista}

    <p>

        Confirmado el

        <br>

        <strong>

            ${fecha}

        </strong>

    </p>

    <div id="codigoQR"

         style="margin-top:25px">

    </div>

</div>

`;

    generarQR();

}

/********************************************************************
 * CONFIRMAR ASISTENCIA
 ********************************************************************/

async function confirmarAsistencia(){

    /***************************************************************
     * Verificar que no haya sido confirmada anteriormente
     ***************************************************************/

    const { data:estadoActual } = await supabaseClient

        .from("invitados")

        .select("confirmado")

        .eq("codigo",App.codigo)

        .single();


    if(estadoActual.confirmado){

        alert("Esta invitación ya fue confirmada.");

        return;

    }


    /***************************************************************
     * Obtener todos los inputs de acompañantes
     ***************************************************************/

    const inputs=document.querySelectorAll(

        'input[id^="acompanante"]'

    );


    let vacios=0;

    inputs.forEach(input=>{

        if(input.value.trim()===""){

            vacios++;

        }

    });


    /***************************************************************
     * Advertencia si deja cupos vacíos
     ***************************************************************/

    if(vacios>0){

        const continuar=confirm(

`No ha registrado todos los acompañantes.

Si confirma ahora posteriormente no podrá agregar más personas.

¿Desea continuar?`

        );

        if(!continuar){

            return;

        }

    }


    /***************************************************************
     * Actualizar invitado
     ***************************************************************/

    const fecha=new Date().toISOString();

    const { error:updateError }=await supabaseClient

        .from("invitados")

        .update({

            confirmado:true,

            fecha_confirmacion:fecha

        })

        .eq("id",App.invitado.id);


    if(updateError){

        console.error(updateError);

        alert("No fue posible confirmar.");

        return;

    }


    /***************************************************************
     * Limpiar tablas relacionadas
     ***************************************************************/

    await supabaseClient

        .from("acompanantes")

        .delete()

        .eq("invitado_id",App.invitado.id);


    await supabaseClient

        .from("personas_evento")

        .delete()

        .eq("invitado_id",App.invitado.id);


    /***************************************************************
     * Registrar invitado principal
     ***************************************************************/

    const { error:principalError }=

        await supabaseClient

        .from("personas_evento")

        .insert({

            invitado_id:App.invitado.id,

            nombre:App.invitado.nombre,

            tipo:"principal",

            orden:0

        });


    if(principalError){

        console.error(principalError);

        alert(

            "Error guardando invitado principal."

        );

        return;

    }


    /***************************************************************
     * Registrar acompañantes
     ***************************************************************/

    for(const input of inputs){

        const nombre=input.value.trim();

        if(nombre===""){

            continue;

        }


        /******************************************************
         * Tabla acompañantes
         ******************************************************/

        const { error:acompError }=

            await supabaseClient

            .from("acompanantes")

            .insert({

                invitado_id:App.invitado.id,

                nombre:nombre

            });


        if(acompError){

            console.error(acompError);

            alert(

                "Error guardando acompañantes."

            );

            return;

        }


        /******************************************************
         * Tabla personas_evento
         ******************************************************/

        const { error:personaError }=

            await supabaseClient

            .from("personas_evento")

            .insert({

                invitado_id:App.invitado.id,

                nombre:nombre,

                tipo:"acompanante",

                orden:Number(

                    input.id.replace(

                        "acompanante",

                        ""

                    )

                )

            });


        if(personaError){

            console.error(personaError);

            alert(

                "Error guardando personas del evento."

            );

            return;

        }

    }


    /***************************************************************
     * Recargar pantalla
     ***************************************************************/

    App.invitado.confirmado=true;

    App.invitado.fecha_confirmacion=fecha;

    await cargarInvitado();

}

/********************************************************************
 * GENERAR QR
 ********************************************************************/

function generarQR(){

    const contenedor=document.getElementById("codigoQR");

    if(!contenedor){

        return;

    }

    contenedor.innerHTML="";

    QRCode.toCanvas(

        document.createElement("canvas"),

        App.codigo,

        {

            width:220,

            margin:2,

            color:{

                dark:"#7B1830",

                light:"#FFFFFF"

            }

        },

        function(error,canvas){

            if(error){

                console.error(error);

                return;

            }

            contenedor.appendChild(canvas);

        }

    );

}


/********************************************************************
 * DESCARGAR QR (Preparado para la V2)
 ********************************************************************/

function descargarQR(){

    const canvas=document.querySelector("#codigoQR canvas");

    if(!canvas){

        return;

    }

    const enlace=document.createElement("a");

    enlace.download=`${App.codigo}.png`;

    enlace.href=canvas.toDataURL("image/png");

    enlace.click();

}


/********************************************************************
 * UTILIDAD
 ********************************************************************/

function mostrarError(mensaje){

    document.getElementById("datosInvitado").innerHTML=`

        <div style="
            margin-top:40px;
            text-align:center;
            color:#7B1830;
            font-size:18px;
        ">

            ${mensaje}

        </div>

    `;

}


/********************************************************************
 * UTILIDAD
 ********************************************************************/

function mostrarAlerta(titulo,mensaje){

    alert(`${titulo}\n\n${mensaje}`);

}
