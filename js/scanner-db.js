/******************************************************************
 *  scanner-db.js
 *  ---------------------------------------------------------------
 *  Todas las consultas a Supabase del Scanner 2.0
 ******************************************************************/

class ScannerDB {

    //==============================================================
    // Buscar invitado por código QR
    //==============================================================

    static async obtenerInvitado(codigo){

        const { data, error } = await supabaseClient
            .from("invitados")
            .select("*")
            .eq("codigo", codigo)
            .single();

        if(error){

            console.error(error);

            return null;
        }

        return data;

    }


    //==============================================================
    // Obtener personas del evento
    //==============================================================

    static async obtenerPersonas(invitadoId){

        const { data, error } = await supabaseClient
            .from("personas_evento")
            .select("*")
            .eq("invitado_id", invitadoId)
            .order("orden");

        if(error){

            console.error(error);

            return [];

        }

        return data;

    }


    //==============================================================
    // Obtener personas que ya ingresaron
    //==============================================================

    static async obtenerIngresos(invitadoId){

        const { data, error } = await supabaseClient
            .from("ingresos")
            .select("*")
            .eq("invitado_id", invitadoId);

        if(error){

            console.error(error);

            return [];

        }

        return data;

    }


    //==============================================================
    // Registrar ingreso de UNA persona
    //==============================================================

    static async registrarIngreso(persona){

        const { error } = await supabaseClient

            .from("ingresos")

            .insert({

                invitado_id: persona.invitado_id,

                nombre_persona: persona.nombre,

                tipo: persona.tipo,

                fecha_ingreso: new Date().toISOString()

            });

        if(error){

            console.error(error);

            return false;

        }

        return true;

    }


    //==============================================================
    // Verificar si una persona ya ingresó
    //==============================================================

    static personaYaIngreso(nombre, ingresos){

        return ingresos.some(

            ingreso => ingreso.nombre_persona === nombre

        );

    }


    //==============================================================
    // Contar personas ingresadas
    //==============================================================

    static contarIngresados(personas, ingresos){

        let contador = 0;

        personas.forEach(persona=>{

            if(

                this.personaYaIngreso(

                    persona.nombre,

                    ingresos

                )

            ){

                contador++;

            }

        });

        return contador;

    }

}
