// Отправка данных для расчета
function sendData() {
    fetch('/compute', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsingData())
    })
    .then((response) => response.json())
    // Запись результатов в структуры данных
    .then(function(obj) {
        let help;
        for (let [key, value] of new Map(Object.entries(obj.data))) {
            help = pipesInfo.get(Number(key));
            help["consumption"] = Number(value);
        }
        alert('Расчеты проведены успешно');
    })
    .catch(function(err) {

    });
}

// Отправка данных для сохранения схемы на сервере
function saveNetwork() {
    fetch('/save', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsingData('save'))
    })
    .then(() => alert('Данные успешно сохранены'))
    .catch(function(err) {

    });
}

// Загрузка сохраненной на сервере схемы
function loadNetwork() {
    resetAll();

    fetch('/load')
        .then(response => response.json())
        .then(function(network) {
            // Установка значений глобальных параметров
            id = network.id;
            map.setView(network.center);

            // Добавление геообъектов
            for (let [key, value] of Object.entries(network.vertices)) {
                initObject(value.type, value.coord, Number(key));
            }

            // Добавление пайпов
            let new_pipe;
            for (let [key, coords] of Object.entries(network.edges)) {
                new_pipe = L.polyline(coords, {});
                new_pipe.bindPopup(
                    L.popup({
                        closeButton: true
                    }).setContent(createCtxMenu('pipe', key))
                );
                new_pipe.addTo(map);
                pipes.set(Number(key), new_pipe);
                pipesInfo.set(Number(key), {
                    consumption: 0
                });
            }

            
        })
        .catch(function(err) {

        });
}

//--------------------------------------------------------------------------------------------------------------

// Подготовка объекта с данными к отправке на сервер
// @mode - для каких целей подготавливаются данные:
// "send" - отправка для расчета, "save" - отправка для сохранеения
function parsingData(mode) {
    let result = {};
    let nodes = new Map();
    let connections = new Map();
    
    switch(mode) {
        case 'send':
            // Данные о геообъектах в виде: id => кооррдинаты
            for (let i = 0; i < geoObjects.length; i++)
                nodes.set(geoObjects[i].id, geoObjects[i].value.getLatLng());
            // Информация об объектах
            result.info = Object.fromEntries(objectsInfo);
            break;
        case 'save':
            // Данные о геообъектах в виде: id => { тип, кооррдинаты }
            for (let i = 0; i < geoObjects.length; i++)
                nodes.set(geoObjects[i].id, {type: geoObjects[i].type, coord: geoObjects[i].value.getLatLng()});
            // Глобальное значение id и координаты центра карты
            result.id = id;
            result.center = map.getCenter();
            break;
        default:
            throw new Error('Error: unknown mode');
    }

    // Данные о координатах точек пайпов
    for (let [key, val] of pipes)
        connections.set(key, val.getLatLngs());

    result.vertices = Object.fromEntries(nodes);
    result.edges = Object.fromEntries(connections);
    
    return result;
}

// Очистка глобальных объектов и удаление объектов с карты
function resetAll() {
    for (let i = 0; i < geoObjects.length; i++)
        geoObjects[i].value.remove();
    for (let pipe of pipes.values())
        pipe.remove(); 

    geoObjects.length = 0;
    pipes.clear();
    objectsInfo.clear();
    pipesInfo.clear();
    polylineEditor = null;
    edId = null;
    edPopup = null;
    pipePopup = null;
}