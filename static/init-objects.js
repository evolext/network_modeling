// Добавление объекта на карту в указанное место
function addObjectOnPoint(type, e) {
    initObject(type, e.latlng);
    // Удаляем обработчик события
    map.off('click');
}


/* Создание геообъекта
    @type - тип геообъекта
    @coordinates=undefined - координаты центра объекта
    @key - он же id объекта, в общем случае устанавливается автоматически, но при загрузке схемы можно задать вручную
*/
function initObject(type, coordinates, key=undefined){
    // Инициализация полей объекта, в зависимости от его типа
    let popupOffset;
    let size = [30, 30];
    let drag = false;
    console.log(id);
    if (typeof key === 'undefined')
        key = id++;
    console.log(key);

    switch (type) {
        case 'source':
            popupOffset = [1, -15];
            break;
        case 'tower':
            popupOffset = [1, -15];
            break;
        case 'standpipe':
            popupOffset = [1, -10];
            size = [25, 25];
            break;
        case 'well':
            popupOffset = [1, -10];
            size = [20, 20];
            break;
        case 'branch':
            popupOffset = [1, -8];
            size = [12, 12];
            break;
        case 'consumer':
            popupOffset = [1, -8];
            size = [15, 15];
            break;
    }

    // Создание кастомной иконки объекта
    let objIcon = L.icon({
        iconUrl: `./icons/${type}.png`,
        iconSize: size,
        popupAnchor: popupOffset
    });

    var obj = L.marker(coordinates, {
        icon: objIcon,
        draggable: drag
    }).addTo(map);

    // Контекстное меню объекта
    obj.bindPopup(createCtxMenu(type, key), {
        closeButton: true
    });

    geoObjects.push({
        id: key,
        type: type,
        value: obj
    });
    objectsInfo.set(key, {
        consumption: 0
    });
}

/* Функция получения шаблона контекстного меню объекта
    @type - тип геообъекта
    @obj_id - идентификатор геообъекта
*/
function createCtxMenu(type, obj_id){
    let ctxMenu;
    switch(type) 
    {
        case 'source':
            ctxMenu = "<table>" +
                        "<tr><td><input type='button' value='Начать путь' class='startPipe popupButton' data-id='" + obj_id + "'/></td></tr>" +
                        "<tr><td><input type='button' value='Информация' class='getInfo popupButton' data-id='" + obj_id + "'/></td></tr>" +
                        "<tr><td><input type='button' value='Удалить объект' class='removeObject popupButton' data-id='" + obj_id + "'/></td></tr>" +
                      "</table>";
            break;
        case 'consumer':
            ctxMenu = "<table>" +
                        "<tr><td><input type='button' value='Информация' class='getInfo popupButton' data-id='" + obj_id + "'/></td></tr>" +
                        "<tr><td><input type='button' value='Удалить объект' class='removeObject popupButton' data-id='" + obj_id + "'/></td></tr>" +
                      "</table>";
            break;
        case 'pipe':
            ctxMenu = "<table>" +
                        "<tr><td><input type='button' value='Редактировать' class='editPipe popupButton' data-id='" + obj_id + "'/></td></tr>" +
                        "<tr><td><input type='button' value='Информация' class='getInfo popupButton' data-id='" + obj_id + "'/></td></tr>" +
                        "<tr><td><input type='button' value='Удалить объект' class='removeObject popupButton' data-id='" + obj_id + "'/></td></tr>" +
                      "</table>";
            break;
        default:
            ctxMenu = "<table>" +
                        "<tr><td><input type='button' value='Начать путь' class='startPipe popupButton' data-id='" + obj_id + "'/></td></tr>" +
                        "<tr><td><input type='button' value='Информация' class='getInfo popupButton' data-id='" + obj_id + "'/></td></tr>" +
                        "<tr><td><input type='button' value='Удалить объект' class='removeObject popupButton' data-id='" + obj_id + "'/></td></tr>" +
                      "</table>";     
            break;
    }
    return ctxMenu;
}

// Инициализация пайпа
function initPipe(firstPoint) {
    // Завершаем редактирование предыдущего пайпа (если есть)
    if (polylineEditor) {
        let old_pipe = pipes.get(edId);
        old_pipe.disableEdit();
        old_pipe.bindPopup(pipePopup);

        polylineEditor = null;
        edId = null;
        pipePopup = null;
    }

    var pipe = L.polyline([firstPoint], {});
    pipePopup= L.popup({
        closeButton: true
    }).setContent(createCtxMenu('pipe'));
    pipe.addTo(map);
    pipes.set(id, pipe);
    pipesInfo.set(id, {
        consumption: 0
    });

    // Запуск редактора
    polylineEditor = pipe.enableEdit();
    polylineEditor.continueBackward();
    edId = id++;
    if (!edPopup) {
        edPopup= L.popup();
        edPopup.setContent(
            "<table>" +
                "<tr><td><input type='button' value='Продолжить путь' class='continuePipe popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Завершить редактирование' class='endPipe popupButton'/></td></tr>" +

                "<tr><td><input type='button' value='Водонапорная башня' class='initTower popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Колонка' class='initStandpipe popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Водопроводный колодец' class='initWell popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Разветвление' class='initBranch popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Потребитель' class='initConsumer popupButton'/></td></tr>" +

                "<tr><td><input type='button' value='Удалить вершину' class='removeVertex popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Удалить весь путь' class='removePipe popupButton'/></td></tr>" +
            "</table>"
        );
    }
}