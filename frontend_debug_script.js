// 🔧 SCRIPT DE DEBUG PARA FRONTEND - Copiar y pegar en consola del navegador

console.log('🚀 Iniciando debug de integración Backend-Frontend...');

// Test completo del flujo de autenticación y documentos
async function testFullFlow() {
  try {
    console.log('\n=== 1. TEST LOGIN ===');
    
    // 1. Login
    const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      })
    });
    
    console.log('Login Status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      throw new Error(`Login falló: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✅ Token obtenido:', token);
    console.log('✅ Usuario:', loginData.user);
    
    // 2. Test headers de autorización
    console.log('\n=== 2. TEST HEADERS AUTHORIZATION ===');
    const authHeaders = {
      'Authorization': `Bearer ${token}`
    };
    console.log('Headers que se enviarán:', authHeaders);
    
    // 3. Test información de usuario
    console.log('\n=== 3. TEST USER INFO ===');
    const userResponse = await fetch('http://localhost:8000/api/users/me', {
      method: 'GET',
      headers: authHeaders
    });
    
    console.log('User Info Status:', userResponse.status);
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Datos usuario:', userData);
    } else {
      console.error('❌ Error user info:', await userResponse.text());
    }
    
    // 4. Test lista de documentos
    console.log('\n=== 4. TEST LISTA DOCUMENTOS ===');
    const docsResponse = await fetch('http://localhost:8000/api/documents', {
      method: 'GET',
      headers: authHeaders
    });
    
    console.log('Documents Status:', docsResponse.status);
    if (docsResponse.ok) {
      const docsData = await docsResponse.json();
      console.log('✅ Documentos obtenidos:', docsData);
      console.log(`📋 Total documentos: ${docsData.pagination.total_documents}`);
    } else {
      console.error('❌ Error documentos:', await docsResponse.text());
    }
    
    // 5. Test upload de archivo (simulado)
    console.log('\n=== 5. TEST UPLOAD (simulado) ===');
    
    // Crear archivo de prueba
    const testFile = new File(['Contenido de prueba'], 'test.txt', {
      type: 'text/plain'
    });
    
    const formData = new FormData();
    formData.append('file', testFile);
    
    console.log('Archivo de prueba creado:', testFile.name, testFile.type);
    console.log('FormData preparado con file');
    
    const uploadResponse = await fetch('http://localhost:8000/api/documents/upload', {
      method: 'POST',
      headers: authHeaders, // Solo Authorization, NO Content-Type
      body: formData
    });
    
    console.log('Upload Status:', uploadResponse.status);
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Upload exitoso:', uploadData);
    } else {
      console.error('❌ Error upload:', await uploadResponse.text());
    }
    
    console.log('\n🎉 ¡Test completo finalizado!');
    return { success: true };
    
  } catch (error) {
    console.error('💥 Error en test:', error);
    return { success: false, error };
  }
}

// Ejecutar test
testFullFlow().then(result => {
  if (result.success) {
    console.log('\n✅ TODOS LOS TESTS PASARON CORRECTAMENTE');
    console.log('👉 El frontend puede usar el mismo código de este test');
  } else {
    console.log('\n❌ FALLÓ EL TEST');
    console.log('👉 Revisar errores arriba para debugging');
  }
});

// Función helper para que el frontend la use
window.apiHelpers = {
  // Login helper
  async login(email, password) {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) throw new Error(`Login error: ${response.status}`);
    return await response.json();
  },
  
  // Get documents helper
  async getDocuments(token, page = 1, limit = 10) {
    const response = await fetch(`http://localhost:8000/api/documents?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`Documents error: ${response.status}`);
    return await response.json();
  },
  
  // Upload file helper
  async uploadFile(token, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:8000/api/documents/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    if (!response.ok) throw new Error(`Upload error: ${response.status}`);
    return await response.json();
  }
};

console.log('\n💡 HELPERS DISPONIBLES:');
console.log('- window.apiHelpers.login(email, password)');
console.log('- window.apiHelpers.getDocuments(token, page, limit)');
console.log('- window.apiHelpers.uploadFile(token, file)');