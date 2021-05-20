//////////////////////////////////////////////////////////////////
//  Модуль для реализации функционала кнопок контекстного меню пайпа
//////////////////////////////////////////////////////////////////


// --------------------------------------------- Для пайпа, находящихся в режиме редактирования -----------------------------------------------

// Пункт "Путь.Продолжить": возобновление построения пути
$('#map').on('click', '.continuePipe', function() {
    app.map.closePopup();  
    app.polylineEditor.continueBackward();
});

// Пункт "Путь.Завершить редактирвоание": завершение построения пути
$('#map').on('click', '.endPipe', function() {
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

// Пункт "Путь.Удалить вершину": удаление последней вершины пути (непоследние удаляются просто левым кликом по ним)
$('#map').on('click', '.removeVertex ', function() {
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

// Пункт "Путь.Удалить весь путь": удаление редактируемого пути
$('#map').on('click', '.removePipe', function() {
    app.map.closePopup();
    let pipe_id = app.editableId;

    // Объект редактируемого пайпа
    let pipe = app.pipes.get(pipe_id);
    pipe.toggleEdit();
    pipe.remove();

    // Удаление декоратора
    app.pipesArrows.get(pipe_id).remove();

    // Удаление всей соответствующей информации
    app.pipes.delete(pipe_id);
    app.pipesArrows.delete(pipe_id);
    app.pipesInfo.delete(pipe_id);

    app.polylineEditor = null;
    app.editableId = null;
    app.pipePopup = null;
});


// ---------------------------------------- Для пайпа, который не находится в режиме редактирования -----------------------------------------------

// Возобновление редактирования пути
$('#map').on('click', '.editPipe', function(e) {
    // Объект возобновляемого пайпа
    let pipe_id = Number(e.target.dataset.id)
    let pipe = app.pipes.get(pipe_id);
    pipe.closePopup();

    // Завершаем редактирование предыдущего (если какой-то до этого редактировался)
    if (app.polylineEditor) {
        let old_pipe = app.pipes.get(app.editableId);
        old_pipe.toggleEdit();
        old_pipe.bindPopup(app.pipePopup);
    }

    app.polylineEditor = pipe.enableEdit();
    app.editableId = pipe_id;
    app.pipePopup = pipe.getPopup();
    pipe.unbindPopup();
});


// Добавление на карту геообъекта (кроме источника)
$('#map').on('click', '.initTower, .initReservoir, .initHydrant, .initStandpipe, .initWell, .initBranch, .initConsumer', function() {
    app.map.closePopup();

    // Определение типа добавляемого объекта
    let obj_type = this.className.split(' ').find(elem => elem.startsWith('init')).substr('init'.length).toLowerCase();

    
    if ((obj_type != 'branch' && obj_type != 'well') || (app.editablePopup.getLatLng() == app.pipes.get(app.editableId).getLatLngs()[0])) {
        // Завршить редактирование пайпа
        endPipeEdit();
    }
    // Если добавляется ответвление (или колодец) по середине пайпа (=> раздлеяем его на два)
    else {
        let pipe_id = app.editableId

        // Получаем координаты вершин одной и второй части пайпа
        let pipe = app.pipes.get(pipe_id);
        let points = pipe.getLatLngs();
        let index = points.indexOf(app.editablePopup.getLatLng());
        let new_points1 = points.slice(index);
        let new_points2 = points.slice(0, index + 1);

        // Удаляем "разделяемый пайп" и всю информацию с ним связанную
        pipe.disableEdit();
        pipe.remove();
        pipes.delete(pipe_id);
        pipesInfo.delete(pipe_id);

        app.polylineEditor = null;
        app.editableId = null;
        app.pipePopup = null;

        // Создаем два новых пайпа
        for (let coords of [new_points1, new_points2]) {
            let new_pipe = L.polyline(coords, {});
            new_pipe.bindPopup(
                L.popup({
                    closeButton: true
                }).setContent(createCtxMenu('pipe'))
            );

            new_pipe.addTo(app.map);
            app.pipes.set(app.id, new_pipe);
            app.pipesInfo.set(app.id++, {
                activity: 1,
                consumption: 0
            });
        }
    }

    // Добавление геообъекта
    initObject(obj_type, app.editablePopup.getLatLng());
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Включить\выключить геообъект
$('#map').on('change', '.toggleObject', function() {
    // Отключение пайпа
    if (typeof this.dataset.id === 'undefined') {
        let pipe = pipes.get(edId);
        let info = pipesInfo.get(edId);

        // Меняем цвет пайпа и информацию
        let clr;
        if (info.activity) {
            info.activity = 0;
            clr = '#f52e00';
        }
        else {
            clr = '#3388ff';
            info.activity = 1;
        }

        pipe.setStyle({
            color: clr
        });
    }
    // Отключение геообъектов
    else {
        let objId = Number(this.dataset.id);
        let obj = geoObjects[geoObjects.findIndex((obj) => obj.id == objId)];
        let info = objectsInfo.get(objId);

        if (info.activity) {
            info.activity = 0;
            obj.value.setIcon(createIcon(obj.type, false));
        }
        else {
            info.activity = 1;
            obj.value.setIcon(createIcon(obj.type));
        }
    }
});