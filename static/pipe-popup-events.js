// Добавление на карту тепловой камеры
$('#map').on('click', '.initChamber', function(e) {
    map.closePopup();
    initObject('chamber', edPopup.getLatLng());
    // Возобновление построения пути
    //polylineEditor.continueBackward();
});

// Добавление на карту потребителя
$('#map').on('click', '.initConsumer', function(e) {
    map.closePopup();
    initObject('consumer', edPopup.getLatLng());
});

// Добавление ответвления пути
$('#map').on('click', '.initBranch', function(e) {
    map.closePopup();
    initObject('branch', edPopup.getLatLng());
});

// Возобновление построение пути
$('#map').on('click', '.continuePipe', function() {
    map.closePopup();  
    polylineEditor.continueBackward();
});

// Завершение построения пути
$('#map').on('click', '.endPipe', function() {
    map.closePopup();
    let pipe = pipes.get(edId);
    pipe.disableEdit();
    pipe.bindPopup(pipePopup);

    polylineEditor = null;
    edId = null;
    pipePopup = null;
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

    polylineEditor = null;
    edId = null;
    pipePopup = null;
});

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