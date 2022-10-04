var unit_arr = [];
var unit_image_arr = [];
var activeUnit = null;
var intCardCounter = 0;//always increments regardless if adding or removing units
var mouseAction = null; //either null (selection), 'move'
var gridBoardRows = 12;
var gridBoardCols = 20;
/* map canvas variables */
let paintCanvas = null;
let context = null;
let colorPicker = null;
let x = 0, y = 0;
let isMouseDown = false;

$(document).ready(function () {	
	
	//alert('hello');
	createBattleGrid('tabBattleGrid',gridBoardRows, gridBoardCols,'grid-tab-div');
	$('.sq-div-click').click(squareClick);
	$('#unit-tray').delegate( ".unit-card", "click",unitCardClick); //unit card click
	$('#unit-tray').delegate( ".arrow-right", "click",unitCardShiftRight); 
	$('#unit-tray').delegate( ".arrow-left", "click",unitCardShiftLeft);

	//control unit butons
	$('#btn-rotate-right').click(rotateRight);
	$('#btn-rotate-left').click(rotateLeft);
	$('#btn-move').click(btnMoveClick);
	$('#btn-delete').click(btnDeleteUnit);
	
	//cmd tray buttons
	$('input[type="file"]').change(fileImportOnChange);
	$('#btn-load-map').click(btnLoadMap);
	$('#btn-create-unit').click(function(){
		$('#txt-loc-letter').val('A');
		$('#txt-loc-number').val('1');
		$('#create-unit-div').show();
	});
	
	//initialize create new map interface
	initializeCreateNewMap();
	
	//initialize unit image array
	initializeUnitImageArray();
	
	//create new unit form
	$('#btn-add-unit').click(addNewUnitForm);
	$('#btn-cancel-unit').click(function(){
		$('#create-unit-div').hide();
	});
	$('#btn-create-map').click(loadCreateMapForm); //create-map-div
	$('#btn-cancel-map').click(hideCreateMapForm);
	$('#btn-use-map').click(setNewMapBasedOnDrawing);
	
	//add map
	$('#grid-tab-div').prepend('<img id="battle-map" src="images/maps/swamp.jpg">');
	
	//test add unit
	createUnit('Sorin','#sq5x3','cyan', 'Sorin.JPG');
	moveUnit(null,'#sq5x3',unit_arr[0]);
	//test add 2nd unit
	createUnit('Merla','#sq9x4','purple','Merla.JPG');
	moveUnit(null,'#sq9x4',unit_arr[1]);
	//test add 3rd unit
	createUnit('Katarina','#sq10x2','teal','Katarina.jpg');
	moveUnit(null,'#sq10x2',unit_arr[2]);
	//test enemy
	createUnit('Orc #1','#sq9x14','pink','orc.jpg');
	moveUnit(null,'#sq9x14',unit_arr[3]);
	
});

function createBattleGrid(strTabID,intRow,intCol,strParentDiv){
	/* create battle grid */
	var strGrid = '<table id="'+strTabID+'" class="battleGridStyle"><tbody>';
	var prefixSq_ID = 'sq'; //main battle grid
	var strSqClass = 'sq-div sq-div-click';
	
	if(strTabID != 'tabBattleGrid'){
		prefixSq_ID = 'm'; //map canvas square id prefix (to not duplicate values from parent battle grid)
		strSqClass = 'sq-div';
	}
	
	var strRow = '';
	for(var x = 0; x < intRow; x++){
		strRow = '<tr>';
		for(var y = 0; y < intCol; y++){
			strRow += '<td id="' + prefixSq_ID + x + 'x'+y+'" class="'+strSqClass+'">'+''+'</td>';
		}
		strRow += '</tr>';
		strGrid = strGrid + strRow;
	}
	
	strGrid = strGrid + '</tbody></table>';
	$('#'+strParentDiv).append(strGrid);
}

function createUnit(unit_name, loc_xy, newColor, image_url){
	var newIndex = unit_arr.length;
	var unit = {
		name:  unit_name,
		unitCardID: 'unit-card'+intCardCounter,
		xy: loc_xy,
		rotate: 0,
		color: newColor,
		image_url: image_url
	};
	intCardCounter++;
	unit_arr.push(unit);
	//console.log(unit_arr);
	
	//add unit to unit-tray
	var showImg = "";
	var showImgSrc = 'images/units/'+image_url;
	if(image_url == null){
		showImg = "hidden";
		showImgSrc = '';
	}
	$('#unit-tray').append('<div id="'+unit.unitCardID+'" class="unit-card"><span class="unit-card-pic"><img height="75px" src="'+showImgSrc+'" '+showImg+' ></span><span class="unitCardPanel"><span class="arrow-left"></span><span class="arrow-right"></span></span></div>');
}

function btnDeleteUnit(){
	if(activeUnit == null)
		return;
	//alert('remove obj from array and view');
	
	//remove unit from board and card from tray
	$(activeUnit.xy+' div').remove();
	$('#'+activeUnit.unitCardID).remove();
	
	//remove unit from array
	var unitIndex = findUnitIndex(activeUnit.xy);
	unit_arr.splice(unitIndex, 1);
	console.log(unit_arr);
	
	//set activeUnit to null, clear selected options
	clearSelectedUnit();
}

function clearSelectedUnit(){
	activeUnit = null;
	$('.selectedUnit').removeClass('selectedUnit');
	$('#player-pic img').attr('src','images/units/blank.jpg');
	$('.lbl-name').text('');
	//reset mouse pointer, in case move unit is active
	$('html,body').css('cursor','default');
	mouseAction = null;
}

function findUnit(loc_xy){
	var isFound = false;
	var foundObject = null;
	var i = 0;
	while(!isFound && i < unit_arr.length){
		if(loc_xy == unit_arr[i].xy){
			foundObject = unit_arr[i];
		}
		i++;
	}
	return foundObject;
}

function findUnitIndex(loc_xy){
	var isFound = false;
	var foundObjectIndex = null;
	var i = 0;
	while(!isFound && i < unit_arr.length){
		if(loc_xy == unit_arr[i].xy){
			foundObjectIndex = i; //found index of unit object
		}
		i++;
	}
	return foundObjectIndex;
}

function unitCardClick(){
	//alert('unitcard:'+$(this).html());
	//alert('unitCard click');
	
	//get square location from unitCard
	var unitCardIndex = $(this).index();
	//alert('obj index: '+unitCardSquare);
	
	//fire click event for unit on board
	$(unit_arr[unitCardIndex].xy).trigger("click");
}

function squareClick(){
	var clickSq = $(this).attr('id');
	//alert(''+clickSq);//sq6x5
	
	//check if click is for move mode and new square is free
	if(mouseAction == 'move' && $('#'+clickSq+' div').length == 0){
		moveUnit(activeUnit.xy,'#'+clickSq,activeUnit);
		btnMoveClick();//undo move cursor
		return;
	}
	
	//selection mode - check if square has object item
	var selectedUnit = $(this).find('div');
	var item_count = $(this).find('div').length;
	//alert('div count '+item_count);
	if(item_count == 0){
		//alert('The square is empty');
		return;
	}
	
	//if mouse is move mode, but user selects new unit -> enter selection mode
	if(mouseAction == 'move'){
		btnMoveClick();
	}
	
	//square as valid unit - populate unit control menu
	populateControlMenu(clickSq);
	$('.selectedUnit').removeClass('selectedUnit');
	$(this).addClass('selectedUnit');
}

function moveUnit(prevSqID,newSqID,unitObj){
	var strUnit = '';
	if(prevSqID == null){
		strUnit = '<div class="sq-unit" style="background-color: '+unitObj.color+'"></div>';
	}
	else {
		strUnit = $(prevSqID+' div').clone();
	}
	
	$(prevSqID+' div').remove(); //first remove old square piece - possibly copy outerhtml
	unitObj.xy = newSqID; //re-assign coords of current moving piece
	$(newSqID).prepend(strUnit);
	//if prev square is null, do not show selected square (caters for initialized pieces)
	if(prevSqID != null){
		$('.selectedUnit').removeClass('selectedUnit');
		$(newSqID).addClass('selectedUnit');
	}
}

function populateControlMenu(xySq){
	activeUnit = findUnit('#'+xySq);
	$('.lbl-name').text(activeUnit.name);
	
	//highlight unit card
	$('.selectedUnitCard').removeClass('selectedUnitCard');
	$('#'+activeUnit.unitCardID).addClass('selectedUnitCard');
	
	//load unit image if it has one
	if(activeUnit.image_url == null){
		$('#player-pic img').hide();
		return;
	}
	//alert(activeUnit.image_url+' count:'+$('#player-pic img').length);
	$('#player-pic img').show();
	$('#player-pic img').attr('src','images/units/'+activeUnit.image_url);
}

/* Shift cards left or right */

function unitCardShiftRight(e){
	//alert('Shift right click');
	var cUnitCardElement = $(this).parent().parent();
	var cUnitCardID = cUnitCardElement.attr('id');
	var cIndex = cUnitCardElement.index(); //get index of parent unit card
	
	if(cIndex == (unit_arr.length-1)) {
		//alert('no swap');
		e.stopPropagation();
		return; //if unit card is the last card, no not move it right
	}
	
	//alert(cUnitCardID);
	
	//move card physically
	cUnitCardElement.next().after($('#'+cUnitCardID));
	
	//move unit object array elements
	var tempObj = unit_arr[cIndex];
	unit_arr[cIndex] = unit_arr[cIndex+1];
	unit_arr[cIndex+1] = tempObj;
	
	e.stopPropagation(); //prevent parent unit card click event
}

function unitCardShiftLeft(e){
	//alert('Shift right click');
	var cUnitCardElement = $(this).parent().parent();
	var cUnitCardID = cUnitCardElement.attr('id');
	var cIndex = cUnitCardElement.index(); //get index of parent unit card
	
	if(cIndex == 0) {
		//alert('no swap');
		e.stopPropagation();
		return; //if unit card is the 1st card, no not move it left
	}
	
	//alert(cUnitCardID);
	
	//move card physically
	cUnitCardElement.prev().before($('#'+cUnitCardID));
	
	//move unit object array elements
	var tempObj = unit_arr[cIndex];
	unit_arr[cIndex] = unit_arr[cIndex-1];
	unit_arr[cIndex-1] = tempObj;
	
	e.stopPropagation(); //prevent parent unit card click event
}

/* Rotate active unit left or right */

function rotateLeft(){
	if(activeUnit == null)
		return;
	var sqCurrent = activeUnit.xy;
	var unitDiv = $(sqCurrent).find('div');
	//rotate active unit based on current 'rotate' value
	activeUnit.rotate = activeUnit.rotate - 45;
	if(activeUnit.rotate < 0)
		activeUnit.rotate = 315;
	
	unitDiv.css({'transform' : 'rotate('+activeUnit.rotate+'deg)'});
}

function rotateRight(){
	if(activeUnit == null)
		return;
	var sqCurrent = activeUnit.xy;
	var unitDiv = $(sqCurrent).find('div');
	//rotate active unit based on current 'rotate' value
	activeUnit.rotate = activeUnit.rotate + 45;
	if(activeUnit.rotate == 365)
		activeUnit.rotate = 0;
	
	unitDiv.css({'transform' : 'rotate('+activeUnit.rotate+'deg)'});
}

function btnMoveClick(){
	if(activeUnit == null)
		return;
	
	if(mouseAction == null){
		$('html,body').css('cursor','crosshair');
		mouseAction = 'move';
	}
	else{
		$('html,body').css('cursor','default');
		mouseAction = null;//standard mouse selector
		//return;
	}
}

/* cmd tray buttons */

function btnLoadMap(){
	//alert('btn load map');
	$('#upload-map').trigger('click');
}

function fileImportOnChange(e)
{
    var fileName = e.target.files[0].name;
	var fileObj = e.target.files[0];
    //alert(fileName);
    //alert(fileName.slice(fileName.length - 5)+"|");
			
    //update UI with selected file
    if(fileName.length < 4 || (fileName.slice(fileName.length - 4) != '.jpg' && fileName.slice(fileName.length - 4) != '.png'))
    {
        //$('#import_file_path').text("");
        alert('The selected excel file must be a .jpg or .png file');
        return;
    }
    else{
        //update background of user interface
        //$('#battle-map').attr('src','images/maps/'+fileName);
		
		//check for file reader support
		if (FileReader && fileName.length) {
			var fr = new FileReader();
			fr.onload = function () {
				document.getElementById('battle-map').src = fr.result;
			}
			fr.readAsDataURL(fileObj);
		}
    }

    //make sure it is .csv and correct prefix
}

/*
document.getElementById('file').onchange = function(){

  var file = this.files[0];

  var reader = new FileReader();
  reader.onload = function(progressEvent){
    // Entire file
    console.log(this.result);

    // By lines
    var lines = this.result.split('\n');
    for(var line = 0; line < lines.length; line++){
      console.log(lines[line]);
    }
  };
  reader.readAsText(file);
};
*/

function initializeUnitImageArray(){
	unit_image_arr.push('blank.jpg');
	unit_image_arr.push('orc.jpg');
	unit_image_arr.push('Katarina.jpg');
	unit_image_arr.push('Merla.jpg');
	unit_image_arr.push('Sorin.jpg');
	
	//console.log(unit_image_arr);
}

function addNewUnitForm(){
	var newColor =  $("#col-unit").val();
	var txtName = $('#txt-unit').val();
	
	/*var txtLetter = $('#txt-loc-letter').val().toUpperCase();//x across coordinate, entered as letter example 'A'
	var txtNumber = $('#txt-loc-number').val();//y going down coordinate
	
	var charCode = txtLetter.charCodeAt(0);
	var intX = charCode-(65); //going across, A = 65 (ascii) = x value 0
	var intY = Number(txtNumber)-1; //going down*/
	
	//loop through grid to find free space on board
	var intRow = 0;
	var intCol = 0;
	var foundFree = false;
	while(intRow < gridBoardRows && !foundFree){
		while(intCol < gridBoardCols && !foundFree){
			if($('#sq'+intRow+'x'+intCol+' div').length == 0){
				foundFree = true;
			}
			else
				intCol++;
		}
		if(!foundFree)
			intRow++;
	}
	var newSquare = '#sq'+intRow+'x'+intCol;
	
	//alert('newSquare: '+newSquare);
	
	//create new unit
	createUnit(txtName,newSquare,newColor+'','bandit.jpg');
	moveUnit(null,newSquare,unit_arr[unit_arr.length-1]);
	
	$('#create-unit-div').hide();
}

/* Create new map form */

function loadCreateMapForm(){
	$('#create-map-div').show();
	$('#create-unit-div').hide();
}

function hideCreateMapForm(){
	$('#create-map-div').hide();
}

/* This initialize function is called once to initialize canvas map form */
function initializeCreateNewMap(){
	paintCanvas = document.querySelector('#map-canvas');
	context = paintCanvas.getContext( '2d' );
	context.lineCap = 'round';
	context.lineWidth = 3;
	colorPicker = document.querySelector( '.map-js-color-picker');
	
	colorPicker.addEventListener( 'change', event => {
		context.strokeStyle = event.target.value; 
	} );

	const lineWidthRange = document.querySelector( '.map-js-line-range' );
	const lineWidthLabel = document.querySelector( '.map-js-range-value' );

	lineWidthRange.addEventListener( 'input', event => {
		const width = event.target.value;
		lineWidthLabel.innerHTML = width;
		context.lineWidth = width;
	} );
	
	const stopDrawing = () => { isMouseDown = false; }
	const startDrawing = event => {
		isMouseDown = true;   
	   [x, y] = [event.offsetX, event.offsetY];  
	}
	const drawLine = event => {
		if ( isMouseDown ) {
			const newX = event.offsetX;
			const newY = event.offsetY;
			context.beginPath();
			context.moveTo( x, y );
			context.lineTo( newX, newY );
			context.stroke();
			//[x, y] = [newX, newY];
			x = newX;
			y = newY;
		}
	}

	paintCanvas.addEventListener( 'mousedown', startDrawing );
	paintCanvas.addEventListener( 'mousemove', drawLine );
	paintCanvas.addEventListener( 'mouseup', stopDrawing );
	paintCanvas.addEventListener( 'mouseout', stopDrawing );
	
	//create grid to assist with drawing
	createBattleGrid('mapCanvasBattleGrid',12, 20,'map-grid-tab-div'); //the 4th parameter is the parent div in create map form
}

function setNewMapBasedOnDrawing(){
	const newMapCanvas = document.getElementById('map-canvas');
	const img    = newMapCanvas.toDataURL('image/png');
	
	//set image in img tag
	$('#battle-map').attr('src',img);
	//hide this form to show main map with new background
	hideCreateMapForm();
}
