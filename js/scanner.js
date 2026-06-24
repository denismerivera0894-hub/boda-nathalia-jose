const SUPABASE_URL = "https://tzxqxtqwyslcenwfdlno.supabase.co";
const SUPABASE_KEY = "sb_publishable_lFvK2K71UPHS8w0mfXS1Jw_AUrwkSdF";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


async function registrarIngreso(codigo){

    const resultado =
        document.getElementById("resultado");

    const { data: invitado } =
    await supabaseClient
        .from("invitados")
        .select("*")
        .eq("codigo", codigo)
        .single();

    if(!invitado){

        resultado.innerHTML = `
            <div class="card error">
                <h2>❌ Invitado no encontrado</h2>
            </div>
        `;

        return;
    }

    const { data: ingresoExistente } =
    await supabaseClient
        .from("ingresos")
        .select("*")
        .eq("invitado_id", invitado.id)
        .maybeSingle();

    if(ingresoExistente){

        resultado.innerHTML = `
            <div class="card error">
                <h2>⚠️ Ya ingresó</h2>

                <h3>${invitado.nombre}</h3>
            </div>
        `;

        return;
    }

    await supabaseClient
        .from("ingresos")
        .insert({
            invitado_id: invitado.id,
            fecha_ingreso:
                new Date().toISOString()
        });

    resultado.innerHTML = `
        <div class="card ok">

            <h2>✅ Ingreso autorizado</h2>

            <h3>${invitado.nombre}</h3>

            <p>
                Cupos:
                ${invitado.cupos}
            </p>

        </div>
    `;
}

const html5QrCode =
    new Html5Qrcode("reader");

let escaneoActivo = true;

async function iniciarCamara(){

    try{

        const devices =
            await Html5Qrcode.getCameras();

        if(devices.length === 0){

            alert(
                "No se encontró cámara"
            );

            return;
        }

        let cameraId =
            devices[devices.length - 1].id;

        await html5QrCode.start(
    {
        facingMode: "environment"
    },
    {
        fps:10,
        qrbox:250,
        aspectRatio:1.0
    },
            async (decodedText)=>{

    if(!escaneoActivo){
        return;
    }

    escaneoActivo = false;

    await registrarIngreso(
        decodedText
    );

    setTimeout(()=>{

        escaneoActivo = true;

    },3000);
}
        );

    }catch(error){

        console.error(error);

        alert(
            "Error iniciando cámara"
        );
    }
}

iniciarCamara();
