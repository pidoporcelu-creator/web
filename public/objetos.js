export function Usuario() {
    
    this.nombre="",
    this.email="",
    this.dni="",
    this.direccion="",
    this.saldo=0,
    this.minimoEnvioGratis=0,
    this.lat=0.0,
    this.lon=0.0,
    this.envioGratis=0,
    this.referencia="",
    this.rol="",
    this.uid="",
    this.telefono=""
 
}

Usuario.prototype.toFirestore = function() {
        return {
        nombre: this.nombre,
        email: this.email,
        dni: this.dni,
        direccion: this.direccion,
        saldo: this.saldo,
        minimoEnvioGratis: this.minimoEnvioGratis,
        lat: this.lat,
        lon: this.lon,
        envioGratis: this.envioGratis,
        referencia: this.referencia,
        rol: this.rol,
        uid: this.uid,
        telefono: this.telefono
            // No incluyas métodos aquí
        };
    }


export function Producto(){
    this.cantidad=0,
    this.categoria="",
    this.codigo=0,
    this.color="",
    this.descripcion="",
    this.fecha=0,
    this.id="",
    this.imagen="",
    this.ingrediente = Array,
    this.ingredientesCantidad =0,
    this.ingredientesCantidadMin = 0,
    this.marca="",
    this.medida="",
    this.nuevo=false,
    this.orden=0,
    this.oferta=false,
    this.precio=0,
    this.stock=0,
    this.talle="",
    this.tamano=0,
    this.tipo="",
    this.title="",
    this.total=0
}

export function Carrito(){
    this.productos = {};
    this.cantidad = 0;
    this.total = 0;
    this.totalFinal = 0; // Total de productos + envío
    this.costoEnvio = 0;
    this.comercio = "";
    this.comercioNombre = "";
    this.totalPeso = 0; // Renombrado de 'peso' para consistencia
    // Las propiedades 'peso' y 'precio' son ambiguas y se eliminan para evitar confusión.
    // Los totales se calculan a partir de los productos.
}

Carrito.prototype.toFirestore = function() {
    const productosArray = Object.values(this.productos);
  
    return {
        productos: productosArray,
        cantidad: this.cantidad,
        total: this.total,
        // ✅ CORRECCIÓN: Calcular el totalFinal aquí para asegurar que siempre sea correcto.
        totalFinal: this.total + this.costoEnvio,
        costoEnvio: this.costoEnvio,
        comercio: this.comercio,
        comercioNombre: this.comercioNombre,
        totalPeso: this.totalPeso
    };
}

export function Comercio(){
    this.activo="false",
    this.cadeteria=0,
    this.ciudad="",
    this.direccion="",
    this.email="",
    this.envioGratis=0,
    this.horarioDeAtencion= {},
    this.imagen="",
    this.lat=0.0,
    this.lon=0.0,
    this.minimoEnvioGratis=0,
    this.nombre="",
    this.rubro="",
    this.tags = Array,  //aqui agregar el nombre y el rubro tmb. para que el usuario lo pueda encontrar facil.
    this.telefono=0,
    this.tiempoDeEntrega=0,
    this.uid="",
    this.actualizado="",
    this.galeria= Array,
    this.envioGestion= "",
    this.envioPrecioPorKm = 0,
    this.envioPrecioMin= 0,
    this.retiro = false,
    this.departamento="",
    this.referencia="",
    this.entreCalles="",
    this.abierto=false
}

export function Cadeteria(){
    this.uid = ""; // UID del usuario que se registra como cadete
    this.nombre = "";
    this.negocio = "";
    this.direccion = "";
    this.lat = 0.0;
    this.lon = 0.0;
    this.telefono = "";
    this.tarifaxkm = 0;
    this.tarifaminima = 0;
    this.activo = false; // Para habilitar o deshabilitar al cadete
    this.imagen = ""; // URL del logo
}

Cadeteria.prototype.toFirestore = function() {
    // Devuelve un objeto plano para ser guardado en Firestore
    return {
        ...this 
        // El operador 'spread' (...) copia todas las propiedades del objeto.
        // Es una forma moderna y corta de hacer lo mismo que en los otros objetos.
    };
}

export function Venta(){
 this.usuario= {},
        this.comercio={},
        this.estado= "Sin procesar",
        this.fecha= firebase.firestore.FieldValue.serverTimestamp(),
        this.id= "",
        this.logistica="envio",  
        this.nota="",
        this.total=0,
        this.carrito={}

}

export class Score {
    constructor(accumulator) {
        this.accumulator = accumulator;
    }
    addOnePoint() { ++this.accumulator; }
    showScore() { return this.accumulator; }
}
