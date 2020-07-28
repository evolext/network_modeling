/* Создание геообъекта
    @type - тип геообъекта
    @coordinates=undefined - координаты центра объекта
*/
function initObject(type, coordinates = undefined){
    // Инициализация полей объекта, в зависимости от его типа
    let iconSize;
    let popupOffset = [0, -13];
    let drag = false;
    switch(type)
    {
        case 'source':
            iconSize = [35, 35];
            popupOffset = [7, -13];
            coordinates = map.getCenter();
            drag = true;
            break;
        case 'chamber':
            iconSize = [30, 30];
            break;
        case 'consumer':
            iconSize = [25, 25];
            break;
        case 'branch':
            iconSize = [25, 25];
            break;
        default:
            throw new Error('Unknown object type');
    }

    // Создание кастомной иконки объекта
    let objIcon = L.icon({
        iconUrl: `./icons/${type}.png`,
        iconSize: iconSize,
        popupAnchor: popupOffset
    });

    var obj = L.marker(coordinates, {
        icon: objIcon,
        draggable: drag
    }).addTo(map);

    // Контекстное меню объекта
    obj.bindPopup(createCtxMenu(type), {
        closeButton: true
    });

    geoObjects.push({
        id: id++,
        type: type,
        value: obj
    });
}

/* Функция получения шаблона контекстного меню объекта
    @type - тип геообъекта
*/
function createCtxMenu(type){
    let ctxMenu = 'someInfo';
    switch(type) 
    {
        case 'source':
            ctxMenu = "<table>" +
                        "<tr><td><input type='button' value='Начать путь' class='startPipe popupButton' data-id='" + id.toString() + "'/></td></tr>" +
                        "<tr><td><input type='button' value='Информация' class='getInfo popupButton' data-id='" + id.toString() + "'/></td></tr>" +
                        "<tr><td><input type='button' value='Удалить источник' class='removeObject popupButton' data-id='" + id.toString() + "'/></td></tr>" +
                      "</table>";
        case 'chamber':
            break;
        case 'consumer':
            break;
        case 'branch':
            break;
    }
    return ctxMenu;
}

// Инициализация пайпа
function initPipe(firstPoint) {
    var pipe = L.polyline([firstPoint], {});
    pipe.addTo(map);
    pipes.set(id, pipe);
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
                "<tr><td><input type='button' value='Тепловая камера' class='initChamber popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Ответвление' class='initBranch popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Потребитель' class='initConsumer popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Удалить вершину' class='removeVertex popupButton'/></td></tr>" +
                "<tr><td><input type='button' value='Удалить весь путь' class='removePipe popupButton'/></td></tr>" +
            "</table>"
        );
    }
}