// Test del flujo de cierre de ventas
// Ejecutar con: node --experimental-modules test-lead-flow.mjs

const testLeadFlow = async () => {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Iniciando test del flujo de cierre...\n');

  // Simular envío de lead completo
  const leadData = {
    nombre: 'Juan Pérez TEST',
    email: 'juan.test@ejemplo.com',
    telefono: '+54 9 11 1234-5678',
    proyecto: 'Necesito un e-commerce con pasarela de pago y gestión de inventario',
    conversacion: [
      'Cliente: Hola, estoy interesado en desarrollo web',
      'Bot: ¡Hola! Ofrezco servicios de desarrollo web completos...',
      'Cliente: Quiero un e-commerce',
      'Bot: ¡Excelente! Para avanzar con tu proyecto necesito algunos datos...',
      'Cliente: Juan Pérez',
      'Bot: Perfecto, Juan Pérez. ¿Cuál es tu email?',
      'Cliente: juan.test@ejemplo.com',
      'Bot: ¿Tenés un teléfono?',
      'Cliente: +54 9 11 1234-5678',
      'Bot: Contame sobre tu proyecto',
      'Cliente: Necesito un e-commerce con pasarela de pago y gestión de inventario',
    ],
  };

  try {
    console.log('📤 Enviando lead al API...\n');
    console.log('Datos:', JSON.stringify(leadData, null, 2));
    console.log('\n');

    const response = await fetch(`${baseURL}/api/lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', result.error);
      return;
    }

    console.log('✅ Lead guardado exitosamente!');
    console.log('📧 Email enviado a: millanpatricio@hotmail.com');
    console.log('🆔 Lead ID:', result.leadId);
    console.log('💬 Mensaje de confirmación:', result.message);
    console.log('\n');
    console.log('✅ Test completado exitosamente!');
    console.log('\n📝 Verifica:');
    console.log('1. El archivo data/leads.json debe contener el lead');
    console.log('2. Deberías recibir un email en millanpatricio@hotmail.com');

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
};

// Ejecutar test
testLeadFlow();
