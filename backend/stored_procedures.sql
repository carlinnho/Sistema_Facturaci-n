-- ============================================================
-- STORED PROCEDURES - Sistema de Facturación y POS
-- Ejecutar DESPUÉS de importar "Base de datos.sql"
-- Base de datos: facturacion_empresa
-- ============================================================

USE facturacion_empresa;

-- ============================================================
-- AUTH
-- ============================================================

DROP PROCEDURE IF EXISTS sp_validar_login_empresa;
DELIMITER $$
CREATE PROCEDURE sp_validar_login_empresa(IN p_email VARCHAR(100))
BEGIN
    SELECT id, ruc, razon_social, nombre_comercial, email_login, password_hash
    FROM detalle_empresa
    WHERE email_login = p_email AND activo = 1
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_listar_perfiles;
DELIMITER $$
CREATE PROCEDURE sp_listar_perfiles()
BEGIN
    SELECT u.id, u.nombres, u.apellidos, u.id_rol, r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id
    WHERE u.activo = 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_login_perfil;
DELIMITER $$
CREATE PROCEDURE sp_login_perfil(IN p_id_usuario INT, IN p_pin CHAR(6))
BEGIN
    DECLARE v_id_rol TINYINT;
    DECLARE v_pin_bd CHAR(6);
    DECLARE v_activo TINYINT;

    SELECT id_rol, pin, activo
    INTO v_id_rol, v_pin_bd, v_activo
    FROM usuarios
    WHERE id = p_id_usuario;

    IF v_activo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no encontrado.';
    END IF;

    IF v_activo = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario inactivo.';
    END IF;

    IF v_id_rol = 1 THEN
        IF p_pin IS NULL OR p_pin = '' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERR_PIN_REQUERIDO';
        END IF;
        IF p_pin <> v_pin_bd THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERR_PIN_INCORRECTO';
        END IF;
    END IF;

    SELECT u.id, u.nombres, u.apellidos, u.id_rol, r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id
    WHERE u.id = p_id_usuario
    LIMIT 1;
END$$
DELIMITER ;

-- ============================================================
-- EMPRESA
-- ============================================================

DROP PROCEDURE IF EXISTS sp_obtener_empresa;
DELIMITER $$
CREATE PROCEDURE sp_obtener_empresa()
BEGIN
    SELECT id, ruc, razon_social, nombre_comercial, direccion,
           telefono, email_login, logo_url, activo
    FROM detalle_empresa
    WHERE activo = 1
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_actualizar_empresa;
DELIMITER $$
CREATE PROCEDURE sp_actualizar_empresa(
    IN p_ruc               VARCHAR(11),
    IN p_razon_social      VARCHAR(150),
    IN p_nombre_comercial  VARCHAR(100),
    IN p_direccion         VARCHAR(255),
    IN p_telefono          VARCHAR(15),
    IN p_email_login       VARCHAR(100),
    IN p_password_hash     VARCHAR(255),
    IN p_logo_url          LONGTEXT
)
BEGIN
    UPDATE detalle_empresa
    SET
        ruc               = COALESCE(p_ruc,              ruc),
        razon_social      = COALESCE(p_razon_social,     razon_social),
        nombre_comercial  = COALESCE(p_nombre_comercial, nombre_comercial),
        direccion         = COALESCE(p_direccion,        direccion),
        telefono          = COALESCE(p_telefono,         telefono),
        email_login       = COALESCE(p_email_login,      email_login),
        password_hash     = COALESCE(p_password_hash,    password_hash),
        logo_url          = COALESCE(p_logo_url,         logo_url)
    WHERE activo = 1;

    SELECT id, ruc, razon_social, nombre_comercial, direccion,
           telefono, email_login, logo_url
    FROM detalle_empresa
    WHERE activo = 1
    LIMIT 1;
END$$
DELIMITER ;

-- ============================================================
-- USUARIOS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_crear_usuario;
DELIMITER $$
CREATE PROCEDURE sp_crear_usuario(
    IN p_nombres   VARCHAR(80),
    IN p_apellidos VARCHAR(80),
    IN p_pin       CHAR(6),
    IN p_id_rol    TINYINT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE id = p_id_rol AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERR_ROL_INVALIDO';
    END IF;

    IF p_id_rol = 1 AND (p_pin IS NULL OR p_pin = '') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERR_PIN_REQUERIDO';
    END IF;

    INSERT INTO usuarios (nombres, apellidos, pin, id_rol)
    VALUES (p_nombres, p_apellidos, p_pin, p_id_rol);

    SELECT u.id, u.nombres, u.apellidos, u.id_rol
    FROM usuarios u
    WHERE u.id = LAST_INSERT_ID()
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_actualizar_usuario;
DELIMITER $$
CREATE PROCEDURE sp_actualizar_usuario(
    IN p_id        INT,
    IN p_nombres   VARCHAR(80),
    IN p_apellidos VARCHAR(80),
    IN p_pin       CHAR(6),
    IN p_id_rol    TINYINT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no encontrado.';
    END IF;

    UPDATE usuarios
    SET
        nombres   = COALESCE(p_nombres,   nombres),
        apellidos = COALESCE(p_apellidos, apellidos),
        pin       = p_pin,
        id_rol    = COALESCE(p_id_rol,    id_rol)
    WHERE id = p_id;

    SELECT u.id, u.nombres, u.apellidos, u.id_rol, r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id
    WHERE u.id = p_id
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_eliminar_usuario;
DELIMITER $$
CREATE PROCEDURE sp_eliminar_usuario(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no encontrado o ya inactivo.';
    END IF;

    UPDATE usuarios SET activo = 0 WHERE id = p_id;
END$$
DELIMITER ;

-- ============================================================
-- CATEGORIAS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_crear_categoria;
DELIMITER $$
CREATE PROCEDURE sp_crear_categoria(IN p_nombre VARCHAR(100))
BEGIN
    IF EXISTS (SELECT 1 FROM categorias WHERE nombre = p_nombre AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe una categoria con ese nombre.';
    END IF;

    INSERT INTO categorias (nombre) VALUES (p_nombre);

    SELECT id, nombre, activo
    FROM categorias
    WHERE id = LAST_INSERT_ID()
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_listar_categorias;
DELIMITER $$
CREATE PROCEDURE sp_listar_categorias()
BEGIN
    SELECT id, nombre, activo
    FROM categorias
    WHERE activo = 1
    ORDER BY nombre;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_actualizar_categoria;
DELIMITER $$
CREATE PROCEDURE sp_actualizar_categoria(IN p_id INT, IN p_nombre VARCHAR(100))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM categorias WHERE id = p_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoria no encontrada.';
    END IF;

    UPDATE categorias SET nombre = p_nombre WHERE id = p_id;

    SELECT id, nombre, activo
    FROM categorias
    WHERE id = p_id
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_eliminar_categoria;
DELIMITER $$
CREATE PROCEDURE sp_eliminar_categoria(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM categorias WHERE id = p_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoria no encontrada o ya desactivada.';
    END IF;

    UPDATE categorias SET activo = 0 WHERE id = p_id;
END$$
DELIMITER ;

-- ============================================================
-- PRODUCTOS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_crear_producto;
DELIMITER $$
CREATE PROCEDURE sp_crear_producto(
    IN p_nombre        VARCHAR(150),
    IN p_codigo_barras VARCHAR(50),
    IN p_precio        DECIMAL(10,2),
    IN p_stock_minimo  INT,
    IN p_stock_actual  INT,
    IN p_id_categoria  INT
)
BEGIN
    DECLARE v_prefijo   CHAR(3);
    DECLARE v_siguiente INT;
    DECLARE v_sku       VARCHAR(20);

    SELECT UPPER(LEFT(nombre, 3))
    INTO v_prefijo
    FROM categorias
    WHERE id = p_id_categoria;

    SELECT COUNT(*) + 1
    INTO v_siguiente
    FROM productos
    WHERE id_categoria = p_id_categoria;

    SET v_sku = CONCAT(v_prefijo, '-', LPAD(v_siguiente, 3, '0'));

    INSERT INTO productos (sku, codigo_barras, nombre, precio, stock_minimo, stock_actual, id_categoria)
    VALUES (v_sku, p_codigo_barras, p_nombre, p_precio, p_stock_minimo, p_stock_actual, p_id_categoria);

    SELECT p.id, p.sku, p.nombre, p.codigo_barras, p.precio,
           p.stock_minimo, p.stock_actual, p.id_categoria, p.estado
    FROM productos p
    WHERE p.id = LAST_INSERT_ID()
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_listar_productos;
DELIMITER $$
CREATE PROCEDURE sp_listar_productos()
BEGIN
    SELECT p.id, p.sku, p.nombre, p.codigo_barras, p.precio,
           p.stock_minimo, p.stock_actual, p.id_categoria,
           c.nombre AS categoria, p.estado,
           p.fecha_creacion, p.fecha_actualizacion
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id
    WHERE p.estado = 'disponible'
    ORDER BY p.sku;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_buscar_producto_por_barras;
DELIMITER $$
CREATE PROCEDURE sp_buscar_producto_por_barras(IN p_codigo VARCHAR(50))
BEGIN
    SELECT p.id, p.sku, p.nombre, p.codigo_barras, p.precio,
           p.stock_minimo, p.stock_actual, p.id_categoria,
           c.nombre AS categoria, p.estado
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id
    WHERE p.codigo_barras = p_codigo AND p.estado = 'disponible'
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_actualizar_producto;
DELIMITER $$
CREATE PROCEDURE sp_actualizar_producto(
    IN p_id            INT,
    IN p_nombre        VARCHAR(150),
    IN p_codigo_barras VARCHAR(50),
    IN p_precio        DECIMAL(10,2),
    IN p_stock_minimo  INT,
    IN p_id_categoria  INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM productos WHERE id = p_id AND estado = 'disponible') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Producto no encontrado.';
    END IF;

    UPDATE productos
    SET
        nombre        = COALESCE(p_nombre,       nombre),
        codigo_barras = p_codigo_barras,
        precio        = COALESCE(p_precio,       precio),
        stock_minimo  = COALESCE(p_stock_minimo, stock_minimo),
        id_categoria  = COALESCE(p_id_categoria, id_categoria)
    WHERE id = p_id;

    SELECT p.id, p.sku, p.nombre, p.codigo_barras, p.precio,
           p.stock_minimo, p.stock_actual, p.id_categoria, p.estado
    FROM productos p
    WHERE p.id = p_id
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_actualizar_stock;
DELIMITER $$
CREATE PROCEDURE sp_actualizar_stock(IN p_id INT, IN p_cantidad INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM productos WHERE id = p_id AND estado = 'disponible') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Producto no encontrado.';
    END IF;

    UPDATE productos SET stock_actual = p_cantidad WHERE id = p_id;

    SELECT id, sku, nombre, stock_actual FROM productos WHERE id = p_id LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_eliminar_producto;
DELIMITER $$
CREATE PROCEDURE sp_eliminar_producto(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM productos WHERE id = p_id AND estado = 'disponible') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Producto no encontrado o ya descontinuado.';
    END IF;

    UPDATE productos
    SET estado = 'descontinuado', fecha_borrado = NOW()
    WHERE id = p_id;
END$$
DELIMITER ;

-- ============================================================
-- PROVEEDORES
-- ============================================================

DROP PROCEDURE IF EXISTS sp_crear_proveedor;
DELIMITER $$
CREATE PROCEDURE sp_crear_proveedor(
    IN p_nombre              VARCHAR(150),
    IN p_descripcion         TEXT,
    IN p_telefono_whatsapp   VARCHAR(15),
    IN p_telefono_fijo       VARCHAR(15),
    IN p_correo              VARCHAR(100)
)
BEGIN
    INSERT INTO proveedores (nombre, descripcion, telefono_whatsapp, telefono_fijo, correo)
    VALUES (p_nombre, p_descripcion, p_telefono_whatsapp, p_telefono_fijo, p_correo);

    SELECT id, nombre, descripcion, telefono_whatsapp, telefono_fijo, correo, activo
    FROM proveedores
    WHERE id = LAST_INSERT_ID()
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_listar_proveedores;
DELIMITER $$
CREATE PROCEDURE sp_listar_proveedores()
BEGIN
    SELECT id, nombre, descripcion, telefono_whatsapp, telefono_fijo, correo, activo,
           fecha_creacion, fecha_actualizacion
    FROM proveedores
    WHERE activo = 1
    ORDER BY nombre;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_actualizar_proveedor;
DELIMITER $$
CREATE PROCEDURE sp_actualizar_proveedor(
    IN p_id                  INT,
    IN p_nombre              VARCHAR(150),
    IN p_descripcion         TEXT,
    IN p_telefono_whatsapp   VARCHAR(15),
    IN p_telefono_fijo       VARCHAR(15),
    IN p_correo              VARCHAR(100)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM proveedores WHERE id = p_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Proveedor no encontrado.';
    END IF;

    UPDATE proveedores
    SET
        nombre            = COALESCE(p_nombre,            nombre),
        descripcion       = COALESCE(p_descripcion,       descripcion),
        telefono_whatsapp = COALESCE(p_telefono_whatsapp, telefono_whatsapp),
        telefono_fijo     = COALESCE(p_telefono_fijo,     telefono_fijo),
        correo            = COALESCE(p_correo,            correo)
    WHERE id = p_id;

    SELECT id, nombre, descripcion, telefono_whatsapp, telefono_fijo, correo, activo
    FROM proveedores
    WHERE id = p_id
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_eliminar_proveedor;
DELIMITER $$
CREATE PROCEDURE sp_eliminar_proveedor(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM proveedores WHERE id = p_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Proveedor no encontrado o ya eliminado.';
    END IF;

    UPDATE proveedores SET activo = 0 WHERE id = p_id;
END$$
DELIMITER ;
