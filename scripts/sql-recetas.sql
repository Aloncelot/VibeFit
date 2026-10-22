-- Recetas fit publicadas en /recetas. El panel de admin las crea y edita.
-- Se puede ejecutar varias veces: la tabla se crea solo si no existe
-- y las recetas iniciales se cargan solo si la tabla está vacía.
-- Ejecutar con:  npm run db:migrar

IF OBJECT_ID('dbo.Recetas', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Recetas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    slug VARCHAR(90) NOT NULL CONSTRAINT UX_Recetas_slug UNIQUE,
    titulo NVARCHAR(120) NOT NULL,
    objetivo VARCHAR(12) NOT NULL CONSTRAINT CK_Recetas_objetivo CHECK (objetivo IN ('definicion', 'volumen')),
    resumen NVARCHAR(300) NOT NULL,
    publicada DATE NOT NULL CONSTRAINT DF_Recetas_publicada DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    tiempo_min SMALLINT NOT NULL CONSTRAINT CK_Recetas_tiempo CHECK (tiempo_min BETWEEN 1 AND 600),
    porciones TINYINT NOT NULL CONSTRAINT CK_Recetas_porciones CHECK (porciones BETWEEN 1 AND 50),
    kcal SMALLINT NOT NULL CONSTRAINT CK_Recetas_kcal CHECK (kcal BETWEEN 0 AND 5000),
    proteina SMALLINT NOT NULL CONSTRAINT CK_Recetas_proteina CHECK (proteina BETWEEN 0 AND 500),
    carbohidratos SMALLINT NOT NULL CONSTRAINT CK_Recetas_carbohidratos CHECK (carbohidratos BETWEEN 0 AND 800),
    grasa SMALLINT NOT NULL CONSTRAINT CK_Recetas_grasa CHECK (grasa BETWEEN 0 AND 400),
    -- Listas guardadas como JSON: [{"cantidad":"60 g","ingrediente":"avena"}] y ["Paso 1", "Paso 2"]
    ingredientes NVARCHAR(MAX) NOT NULL CONSTRAINT CK_Recetas_ingredientes CHECK (ISJSON(ingredientes) = 1),
    pasos NVARCHAR(MAX) NOT NULL CONSTRAINT CK_Recetas_pasos CHECK (ISJSON(pasos) = 1),
    consejo NVARCHAR(400) NULL,
    imagen_url NVARCHAR(500) NULL,
    visible BIT NOT NULL CONSTRAINT DF_Recetas_visible DEFAULT 1,
    creada_en DATETIME2 NOT NULL CONSTRAINT DF_Recetas_creada DEFAULT SYSUTCDATETIME(),
    actualizada_en DATETIME2 NULL
  );
  CREATE INDEX IX_Recetas_publicadas ON dbo.Recetas(visible, publicada DESC) INCLUDE (slug, titulo, objetivo);
END
GO

-- Recetas iniciales (las que antes estaban escritas en el código).
IF NOT EXISTS (SELECT 1 FROM dbo.Recetas)
BEGIN
  INSERT INTO dbo.Recetas
    (slug, titulo, objetivo, resumen, publicada, tiempo_min, porciones, kcal, proteina, carbohidratos, grasa, ingredientes, pasos, consejo)
  VALUES
    (N'pollo-al-chipotle-con-arroz-y-frijoles', N'Pollo al chipotle con arroz y frijoles', N'volumen', N'La comida de batch cooking de siempre, con 54 g de proteína y carbohidratos para entrenar pierna.', '2026-09-16', 30, 1, 675, 54, 81, 15,
     N'[{"cantidad":"180 g","ingrediente":"pechuga de pollo cruda"},{"cantidad":"1 cda","ingrediente":"chipotle adobado, licuado"},{"cantidad":"1 cdta","ingrediente":"aceite de oliva"},{"cantidad":"1 taza (200 g)","ingrediente":"arroz blanco cocido"},{"cantidad":"½ taza","ingrediente":"frijoles negros de la olla, escurridos"},{"cantidad":"40 g","ingrediente":"aguacate"},{"cantidad":"al gusto","ingrediente":"ajo en polvo, sal y limón"}]',
     N'["Corta el pollo en tiras y marínalo con el chipotle, el ajo y la sal por al menos 10 minutos.","Calienta el aceite en un sartén a fuego medio-alto y dora el pollo 6 a 8 minutos, hasta que esté bien cocido.","Calienta el arroz y los frijoles.","Arma el plato con arroz, frijoles, pollo y aguacate. Termina con limón."]',
     N'Para preparar la semana, multiplica por cinco y guarda en recipientes de vidrio hasta 4 días.'),
    (N'bowl-de-claras-pavo-y-espinaca', N'Bowl de claras, pavo y espinaca', N'definicion', N'Desayuno salado de 355 kcal con 47 g de proteína y dos tortillas, para no sentir que estás a dieta.', '2026-09-23', 12, 1, 355, 47, 35, 3,
     N'[{"cantidad":"250 ml","ingrediente":"claras de huevo"},{"cantidad":"60 g","ingrediente":"pechuga de pavo en cubos"},{"cantidad":"1 taza","ingrediente":"espinaca baby"},{"cantidad":"80 g","ingrediente":"champiñones rebanados"},{"cantidad":"2","ingrediente":"tortillas de maíz"},{"cantidad":"3 cdas","ingrediente":"salsa verde"},{"cantidad":"al gusto","ingrediente":"aceite en aerosol, sal y pimienta"}]',
     N'["Rocía un sartén con aceite en aerosol y saltea los champiñones 3 minutos a fuego alto.","Agrega el pavo y la espinaca y cocina hasta que la espinaca se marchite.","Vierte las claras, baja el fuego y mueve suavemente hasta que cuajen.","Sirve en un bowl con la salsa verde y calienta las tortillas al comal."]',
     NULL),
    (N'licuado-de-masa-casero', N'Licuado de masa casero', N'volumen', N'Más de 700 kcal en un vaso para cuando no te alcanza el apetito para llegar a tus calorías.', '2026-09-30', 5, 1, 733, 46, 81, 25,
     N'[{"cantidad":"1 medida (30 g)","ingrediente":"proteína whey sabor chocolate"},{"cantidad":"300 ml","ingrediente":"leche entera"},{"cantidad":"50 g","ingrediente":"avena en hojuelas"},{"cantidad":"1","ingrediente":"plátano mediano"},{"cantidad":"20 g","ingrediente":"crema de cacahuate natural"},{"cantidad":"4","ingrediente":"cubos de hielo"}]',
     N'["Licúa primero la avena con la leche durante 30 segundos para que no quede arenosa.","Agrega el resto de los ingredientes y licúa 30 segundos más."]',
     N'Tómalo entre comidas, no en lugar de una: el objetivo es sumar calorías.'),
    (N'ceviche-de-atun-con-pepino', N'Ceviche de atún con pepino', N'definicion', N'Comida fresca de más de 55 g de proteína y menos de 500 kcal, lista en 10 minutos y sin estufa.', '2026-10-07', 10, 1, 457, 57, 37, 9,
     N'[{"cantidad":"2 latas (200 g drenado)","ingrediente":"atún en agua"},{"cantidad":"1","ingrediente":"pepino mediano en cubos"},{"cantidad":"1","ingrediente":"jitomate en cubos"},{"cantidad":"¼","ingrediente":"cebolla morada picada fina"},{"cantidad":"3","ingrediente":"limones, el jugo"},{"cantidad":"1","ingrediente":"chile serrano picado, al gusto"},{"cantidad":"30 g","ingrediente":"aguacate"},{"cantidad":"2","ingrediente":"tostadas horneadas"},{"cantidad":"al gusto","ingrediente":"cilantro, sal y salsa picante"}]',
     N'["Escurre muy bien el atún y desmenúzalo en un tazón.","Agrega pepino, jitomate, cebolla, chile y cilantro.","Exprime los limones, sazona con sal y mezcla. Deja reposar 5 minutos en el refrigerador.","Sirve sobre las tostadas con el aguacate en láminas."]',
     N'Si cuentas sodio en la semana de competencia, cambia el atún de lata por 200 g de atún fresco.'),
    (N'hotcakes-avena-whey', N'Hotcakes de avena y whey', N'volumen', N'Desayuno de volumen que se hace en una licuadora: avena, plátano, huevo y una medida de proteína.', '2026-10-14', 15, 1, 740, 52, 79, 24,
     N'[{"cantidad":"60 g","ingrediente":"avena en hojuelas"},{"cantidad":"1 medida (30 g)","ingrediente":"proteína whey sabor vainilla"},{"cantidad":"2","ingrediente":"huevos enteros"},{"cantidad":"1","ingrediente":"plátano mediano maduro"},{"cantidad":"100 ml","ingrediente":"leche descremada"},{"cantidad":"15 g","ingrediente":"crema de cacahuate natural, para servir"},{"cantidad":"1 pizca","ingrediente":"canela y polvo para hornear"}]',
     N'["Licúa la avena, la proteína, los huevos, el plátano, la leche, la canela y el polvo para hornear hasta tener una mezcla espesa.","Deja reposar la mezcla 3 minutos para que la avena se hidrate.","Calienta un sartén antiadherente a fuego medio-bajo y vierte un cucharón por hotcake.","Voltea cuando salgan burbujas en la superficie, a los 2 minutos aprox., y cocina 1 minuto más.","Sirve con la crema de cacahuate encima."]',
     N'El fuego bajo importa: la proteína whey se quema rápido y deja los hotcakes secos.');
END
GO
