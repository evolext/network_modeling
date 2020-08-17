// Добавление на карту геообъекта (кроме источника)
$('#map').on('click', '.initTower, .initReservoir, .initHydrant, .initStandpipe, .initWell, .initBranch, .initConsumer', function() {
    map.closePopup();
    // Определение типа добавляемого объекта
    let obj_type = this.className.split(' ').find(elem => elem.startsWith('init')).substr('init'.length).toLowerCase();

    // Если добавляется ответвление по середине пайпа (раздлеяем его на два)
    if (obj_type == 'branch' && edPopup.getLatLng() != pipes.get(edId).getLatLngs()[0]) {
        // Получаем координаты вершин одной и второй части пайпа
        let pipe = pipes.get(edId);
        let points = pipe.getLatLngs();
        let index = points.indexOf(edPopup.getLatLng());
        let new_points1 = points.slice(index);
        let new_points2 = points.slice(0, index + 1);

        // Удаляем "разделяемый пайп" и всю информацию с ним связанную
        pipe.disableEdit();
        pipe.remove();
        pipes.delete(edId);
        pipesInfo.delete(edId);
        polylineEditor = null;
        edId = null;
        pipePopup = null;

        // Создаем два новых пайпа
        for (let coords of [new_points1, new_points2]) {
            let new_pipe = L.polyline(coords, {});
            new_pipe.bindPopup(
                L.popup({
                    closeButton: true
                }).setContent(createCtxMenu('pipe'))
            );
            new_pipe.addTo(map);
            pipes.set(id, new_pipe);
            pipesInfo.set(id++, {
                consumption: 0
            });
        }
    }
    else {
        // Завршить редактирование пайпа
        endPipeEdit();
    }

    // Добавление геообъекта
    initObject(obj_type, edPopup.getLatLng());
});

// Возобновление построение пути
$('#map').on('click', '.continuePipe', function() {
    map.closePopup();  
    polylineEditor.continueBackward();
});

// Завершение построения пути
$('#map').on('click', '.endPipe', function() {
    map.closePopup();
    endPipeEdit();
});

// Удаление последней вершины пути
$('#map').on('click', '.removeVertex ', function() {
    map.closePopup();
    let pipe = pipes.get(edId);
    // Массив точек исходного пайпа
    let points = pipe.getLatLngs();
    points.shift();
    pipe.setLatLngs(points);
    pipe.redraw().toggleEdit();
    polylineEditor = pipe.enableEdit();
});

// Удаление редактируемого пути
$('#map').on('click', '.removePipe', function() {
    map.closePopup();
    let pipe = pipes.get(edId);
    pipe.toggleEdit();
    pipe.remove();
    pipes.delete(edId);
    pipesInfo.delete(edId);

    polylineEditor = null;
    edId = null;
    pipePopup = null;
});

// Функция завершения редактирования пайпа
function endPipeEdit() {
    let pipe = pipes.get(edId);
    pipe.disableEdit();
    pipe.bindPopup(pipePopup);

    polylineEditor = null;
    edId = null;
    pipePopup = null;
}

//-------------------------------------------------------------------------------------------------------------------

// Возобновление редактирования пути
$('#map').on('click', '.editPipe', function(e) {
    let new_pipe = pipes.get(Number(e.target.dataset.id));
    new_pipe.closePopup();

    // Завершаем редактирование предыдущего (если какой-то до этого редактировался)
    if (polylineEditor) {
        let old_pipe = pipes.get(edId);
        old_pipe.toggleEdit();
        old_pipe.bindPopup(pipePopup);
    }

    polylineEditor = new_pipe.enableEdit();
    edId = Number(e.target.dataset.id);
    pipePopup = new_pipe.getPopup();
    new_pipe.unbindPopup();
});