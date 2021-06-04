//////////////////////////////////////////////////////////////////
//  Модуль для управления инициализацией геообъектов на карте
//////////////////////////////////////////////////////////////////


// Добавляет объект на карту в указанное место
function addObjectOnPoint(obj_type, e) {
    // Создание объекта
    initObject(obj_type, e.latlng);
    // Удаляем обработчик события
    app.map.off("click");
}

/* Создает геообъект
    @type - тип геообъекта
    @coordinates - координаты центра объекта
    @key - он же id объекта, в общем случае устанавливается автоматически,
           но при загрузке схемы указывается тот, что был у объекта на момент сохранения
    @mode: 0 - выключенный объект, 1 - включенный объект
*/
function initObject(type, coordinates, key=undefined, mode=1) {

    // key не инициализируется при развертывании схемы
    if (typeof key === "undefined") {
        key = app.id++;
    }
        
    // Создание кастомной иконки объекта
    let objIcon = createIcon(type, mode);

    var obj = L.marker(coordinates, {
        icon: objIcon,
        draggable: false
    }).addTo(app.map);

    // Контекстное меню объекта
    obj.bindPopup(createCtxMenu(type, key), {
       closeButton: true
    });

    app.geoObjects.push({
        id: key,
        type: type,
        value: obj
    });

    app.objectsInfo.set(key, new ParamInfo(true));
}


/* Создает кастомную иконку геообъекта
    @type - тип геообъекта
    @mode - включен ли геообъект
*/
function createIcon(type, mode=true) {
    let popupOffset;
    let size = [30, 30];

    switch (type) {
        case "source":
            popupOffset = [1, -15];
            break;
        case "tower":
            popupOffset = [1, -15];
            break;
        case "reservoir":
            popupOffset = [-3, -15];
            break;
        case "standpipe":
            popupOffset = [1, -10];
            size = [25, 25];
            break;
        case "hydrant":
            popupOffset = [0, -10];
            size = [20, 20];
            break;
        case "well":
            popupOffset = [0, -10];
            size = [20, 20];
            break;
        case "branch":
            popupOffset = [1, -8];
            size = [12, 12];
            break;
        case "consumer":
            popupOffset = [1, -8];
            size = [15, 15];
            break;
    }

    let url = `./images/panel_icons/` + app.mode.toLowerCase() + `/${type}.png`;
    let icon = L.icon({
        iconUrl: url,
        iconSize: size,
        popupAnchor: popupOffset
    });

    return icon;
}

/* Создает html-элемент контекстного меню геообъекта
    @type - тип геообъекта
    @obj_id - идентификатор геообъекта
*/
function createCtxMenu(type, obj_id){
    let ctxMenu = "<div style='display: flex; flex-direction: column;'>"

    switch(type) 
    {
        case "pipe":
            ctxMenu += "<button class='editPipe popupButton' data-id='" + obj_id + "'>Редактировать</button>";
            break;
        default:
            ctxMenu += "<button class='startPipe popupButton' data-id='" + obj_id + "'>Начать путь</button>";
            break;
    }

    ctxMenu += "<button class='getInfo popupButton' data-id='" + obj_id + "'>Информация</button>";
    ctxMenu += "<button class='removeObject popupButton' data-id='" + obj_id + "'>Удалить объект</button>";
    ctxMenu += "</div>";
    return ctxMenu;
}


// Создает объект участка
function initPipe(firstPoint) {
    let pipeId = app.id;
    
    // Завершаем редактирование предыдущего пайпа (если есть)
    if (app.polylineEditor) {
        // Завершаем редактировение старого пайпа и возвращаем ему popup для статики
        let oldPipe = app.pipes.get(app.editableId);
        oldPipe.disableEdit();
        oldPipe.bindPopup(app.pipePopup);

        // Возвращаем настройки так, будто бы до этого пайп не редактировался
        app.polylineEditor = null;
        app.editableId = null;
        app.pipePopup = null;
    }

    var pipe = L.polyline([firstPoint], {});
    app.pipePopup= L.popup({
        closeButton: true
    }).setContent(createCtxMenu("pipe", pipeId));

    // Отображение на карте
    pipe.addTo(app.map);

    // Добавление стрелок
    var decorator = L.polylineDecorator(pipe, {
        patterns: [{
            // Величина смещения первой стрелки отностиельно первой вершины
            offset: 10,   
            // Величина смещения стрелки отностельно последней вершины  
            endOffset: 10,
            // Расстояние между стрелками
            repeat: 40,
            // Экземпляр класса стрелки
            symbol: L.Symbol.arrowHead({
                // Длина стрелки
                pixelSize: 15,
                // Угол стрелки
                headAngle: 35,
                pathOptions: {
                    // Прозрачность
                    fillOpacity: 1,
                    // Выделение жирное
                    weight: 0
                }
            })
        }]
    }).addTo(app.map);

    app.pipes.set(pipeId, pipe);
    app.objectsInfo.set(pipeId, new ParamInfo(false));
    app.pipesArrows.set(pipeId, decorator);

    // Запуск редактора
    app.polylineEditor = pipe.enableEdit();
    app.polylineEditor.continueBackward();
    app.editableId = app.id++;;
}


// Инициализирует объект-информацию по объекту сети
//  @obj_flag - флаг типа объекта сети: true = узел, false = участок
function ParamInfo(objectFlag = true) {
    // Название объекта
    this.name = objectFlag ? `Узел #${app.geoObjects.length}` : `Участок #${app.pipes.size}`;

    // Расход и напор
    this.q = undefined;
    this.h = undefined;

    if (!objectFlag) {
        this.length = undefined;
        this.material = "cost_iron";
        this.diameter = "150";
        this.velocity = "0.3";
        this.resist = undefined;
    }
}