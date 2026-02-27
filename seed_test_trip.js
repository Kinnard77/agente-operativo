/**
 * seed_test_trip.js
 * Crea un viaje de prueba con precio $1 MXN en estado LISTO_PARA_OPERAR
 * directamente en Supabase para verificar que el backend de MercadoPago responde.
 *
 * Uso: node seed_test_trip.js
 * Requiere: SUPABASE_URL y SUPABASE_SERVICE_KEY como variables de entorno
 * o edita los valores hardcodeados abajo.
 */

const { createClient } = require('@supabase/supabase-js');

// =========================================================
// CONFIGURA AQUÍ TUS CREDENCIALES (solo para esta prueba)
// =========================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://czkddpcluizlcftunfcw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'PEGA_TU_SERVICE_ROLE_KEY_AQUI';
// =========================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

const TEST_TRIP_ID = 'SAL-TEST-MXPAGO-0001';

async function main() {
    console.log('🔧 Verificando conexión a Supabase...');
    const { error: pingErr } = await supabase.from('itinerario_salidas').select('id_salida').limit(1);
    if (pingErr) {
        console.error('❌ Fallo de conexión:', pingErr.message);
        process.exit(1);
    }
    console.log('✅ Supabase OK');

    // Limpiar si ya existe un viaje de prueba previo
    await supabase.from('itinerario_salidas').delete().eq('id_salida', TEST_TRIP_ID);

    const now = new Date().toISOString();
    const itinerario = {
        id_salida: TEST_TRIP_ID,
        ciudad_origen: 'CDMX',
        ciudad_salida: 'CDMX',
        punto_encuentro: 'Ángel de la Independencia',
        coordenadas_salida: '19.42715, -99.16756',
        fecha_salida: '2026-06-01',
        timestamp_creacion: now,
        modo: 'CERTIFICACIÓN',
        precio_total: 1,               // ← $1 MXN para prueba MP
        hora_salida: '07:00',
        auditoria: {
            estado: 'LISTO_PARA_OPERAR',
            bloqueadores: [],
            timestamp_auditoria: now
        },
        ruta_critica: [
            { id: 'stop-1', localizacion: 'Ángel de la Independencia', h_llegada: 'POR DEFINIR', h_salida: '07:00' },
            { id: 'stop-2', localizacion: 'Checkpoint 1', h_llegada: '08:00', h_salida: '08:15' },
            { id: 'stop-3', localizacion: 'COMIDA (Parada Rígida)', h_llegada: '13:00', h_salida: '14:00', es_comida: true },
            { id: 'stop-4', localizacion: 'Checkpoint 2', h_llegada: '16:00', h_salida: '16:15' },
            { id: 'stop-5', localizacion: 'Tour Odisea Challenge (Meta)', h_llegada: '18:00', h_salida: 'POR DEFINIR' }
        ],
        logistica: { capacidad_requerida: 40 },
        ventana_comida: { inicio: '13:00', fin: '14:00' }
    };

    console.log(`\n📦 Insertando viaje de prueba: ${TEST_TRIP_ID}`);
    const { data, error } = await supabase
        .from('itinerario_salidas')
        .insert({
            id_salida: TEST_TRIP_ID,
            ciudad_origen: 'CDMX',
            destino_final: 'Odisea Challenge',
            fecha_salida: '2026-06-01',
            estado: 'LISTO_PARA_OPERAR',
            modo: 'CERTIFICACIÓN',
            itinerario,
            user_id: null  // <- permite null si tu tabla lo acepta; si no, pon el UUID de tu user
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Error al insertar viaje:', error.message);
        console.error('   Code:', error.code);
        console.error('   Hint:', error.hint);
        process.exit(1);
    }

    console.log(`✅ Viaje insertado! DB UUID: ${data.id}`);
    console.log(`\n🧪 PRUEBA DE CONEXIÓN MERCADO PAGO:`);
    console.log(`   1. El viaje "${TEST_TRIP_ID}" con precio $1 MXN ya está en Supabase`);
    console.log(`   2. Llama al backend Railway:`);
    console.log(`      GET  https://api.odiseachallenge.com/trips`);
    console.log(`      POST https://api.odiseachallenge.com/reservations`);
    console.log(`           { "trip_id": "${TEST_TRIP_ID}", "full_name": "Test User", "email": "test@test.com", "qty": 1 }`);
    console.log(`   3. Con el reservation_id recibido:`);
    console.log(`      POST https://api.odiseachallenge.com/create_preference`);
    console.log(`           { "reservation_id": "<ID_DE_RESERVA>" }`);
    console.log(`   → init_point = URL de pago Mercado Pago $1 MXN\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
