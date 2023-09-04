//////////////////////////////////////////////////////////////////
//  Модуль для реализации функционала кнопок контекстного меню пайпа
//////////////////////////////////////////////////////////////////


// --------------------------------------------- Для пайпа, находящихся в режиме редактирования -----------------------------------------------

// Обрабатывает событие из контекстного меню редактирования
// участка сети на добавление новой точки
$("#map").on("click", ".continuePipe", function() {
    app.map.closePopup();  
    app.polylineEditor.continueBackward();
});

// Обрабатывает событие из контекстного меню редактируемого
// участка на завершение его редактирования
$("#map").on("click", ".endPipe", function() {
    app.map.closePopup();
    endPipeEdit();
});


// Функция завершения редактирования пайпа
function endPipeEdit() {
    // Объект редактируемого пайпа
    let pipe = app.pipes.get(app.editableId);
    pipe.disableEdit();
    // Возвращаем ему popup статики
    pipe.bindPopup(app.pipePopup);

    app.polylineEditor = null;
    app.editableId = null;
    app.pipePopup = null;
}

// Обрабатывает событие из контекстного меню
// редактируемого участка на удаление одной из его вершин
$("#map").on("click", ".removeVertex", function() {
    app.map.closePopup();
    // Объект редактируемого пайпа
    let pipe = app.pipes.get(app.editableId);

    // Массив точек исходного пайпа
    let points = pipe.getLatLngs();
    points.shift();
    pipe.setLatLngs(points);
    pipe.redraw().toggleEdit();
    app.polylineEditor = pipe.enableEdit();
});


// Обрабатывает событие из контекстного меню 
// редактируемого участка на его удаление с карты
$("#map").on("click", ".removePipe", function() {
    app.map.closePopup();
    let pipeId = app.editableId;

    // Объект редактируемого пайпа
    let pipe = app.pipes.get(pipeId);
    pipe.toggleEdit();
    pipe.remove();

    // Удаление декоратора (для сетей водоснабжения)
    if (app.mode == "WATER") {
        app.pipesArrows.get(pipeId).remove();
        app.pipesArrows.delete(pipeId);
    }
    
    // Удаление всей соответствующей информации
    app.pipes.delete(pipeId);
    app.objectsInfo.delete(pipeId);

    app.polylineEditor = null;
    app.editableId = null;
    app.pipePopup = null;
});


// ---------------------------------------- Для пайпа, который не находится в режиме редактирования -----------------------------------------------

// Возобновляет редактирование участка
$("#map").on("click", ".editPipe", function(e) {
    // Объект возобновляемого пайпа
    let pipeId = Number(e.target.dataset.id)
    let pipe = app.pipes.get(pipeId);
    pipe.closePopup();

    // Завершаем редактирование предыдущего (если какой-то до этого редактировался)
    if (app.polylineEditor) {
        let oldPipe = app.pipes.get(app.editableId);
        oldPipe.toggleEdit();
        oldPipe.bindPopup(app.pipePopup);
    }

    app.polylineEditor = pipe.enableEdit();
    app.editableId = pipeId;
    app.pipePopup = pipe.getPopup();
    pipe.unbindPopup();
});


// Добавление на карту геообъекта (кроме источника)
$("#map").on("click", ".initTower, .initReservoir, .initHydrant, .initStandpipe, .initWell, .initBranch, .initConsumer", function() {
    app.map.closePopup();

    // Определение типа добавляемого объекта
    let objectType = this.className.split(' ').find(elem => elem.startsWith("init")).substr("init".length).toLowerCase();

    
    if ((objectType != "branch" && objectType != "well") || (app.editablePopup.getLatLng() == app.pipes.get(app.editableId).getLatLngs()[0])) {
        // Завршить редактирование пайпа
        endPipeEdit();
    }
    // Если добавляется ответвление (или колодец) по середине пайпа (=> раздлеяем его на два)
    else {
        let pipeId = app.editableId;

        // Получаем координаты вершин одной и второй части пайпа
        let pipe = app.pipes.get(pipeId);
        let points = pipe.getLatLngs();
        let index = points.indexOf(app.editablePopup.getLatLng());
        let newPointsPrev = points.slice(index);
        let newPointsPost = points.slice(0, index + 1);

        // Удаляем "разделяемый пайп" и всю информацию с ним связанную
        pipe.disableEdit();
        pipe.remove();
        app.pipes.delete(pipeId);
        app.objectsInfo.delete(pipeId);

        app.polylineEditor = null;
        app.editableId = null;
        app.pipePopup = null;

        // Создаем два новых пайпа
        for (let coords of [newPointsPrev, newPointsPost]) {
            let newPipe = L.polyline(coords, {});
            newPipe.bindPopup(
                L.popup({
                    closeButton: true
                }).setContent(createCtxMenu("pipe"))
            );

            newPipe.addTo(app.map);
            app.pipes.set(app.id, newPipe);
            app.objectsInfo.set(app.id++, ParamInfo(false));
        }
    }

    // Добавление геообъекта
    initObject(objectType, app.editablePopup.getLatLng());
});
