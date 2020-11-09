#target AfterEffects

// Array.prototype.some extensions. This is not implemented in ExtendScript by Default.
Array.prototype.some||(Array.prototype.some=function(r){"use strict";if(null==this)throw new TypeError("Array.prototype.some called on null or undefined");if("function"!=typeof r)throw new TypeError;for(var e=Object(this),t=e.length>>>0,o=arguments.length>=2?arguments[1]:void 0,n=0;t>n;n++)if(n in e&&r.call(o,e[n],n,e))return!0;return!1});
Array.prototype.forEach||(Array.prototype.forEach=function(r,t){var o,n;if(null==this)throw new TypeError(" this is null or not defined");var e=Object(this),i=e.length>>>0;if("function"!=typeof r)throw new TypeError(r+" is not a function");for(arguments.length>1&&(o=t),n=0;i>n;){var a;n in e&&(a=e[n],r.call(o,a,n,e)),n++}});

var ListWindow = (function (thisObj, inTitle, inNumColumns, columnTitles) {
    /*
    List Window Object
    Creates a new Window with a single List Item.
    
    Usage:
    var popup = new PopupWindow();
    
    Methods
    popup.show();
    popup.hide();
    popup.clear();
    popup.setlist( arr1, arr2, arr3, arr4 )
    */
    
    
    {//Popup Globals
        if (inTitle == null){
            var title = '';
        } else {
           var title = inTitle;
        }
        var numColumns = inNumColumns
       //popupWindow Definition
        {
            var palette = thisObj instanceof Panel ? thisObj : new Window('palette', title,undefined, {
                resizeable: true,
                alignChildren: ['fill','fill'],
                maximumSize: ['', 400],
                margins: 10,
                spacing: 10
            });
            if (palette == null) return;
        }
    }
    {//popupWindow Event Functions
        function button_cancel_onClick(){
            palette.close()
            return false
        }
        function button_copy_onClick(){
            palette.close()
            return true
        }
    }
    //popupWindow UI
    {
        var headerGroup = palette.add('group',undefined,{
            name: 'headerGroup',
            spacing: 10,
            margins: 10
        })
            var headerText = headerGroup.add('statictext',undefined,'Found the following footage locations:') 
        var listGroup = palette.add('group', undefined, {
            name: 'listGroup',
            spacing: 0,
            margins: 0
        });
            var popupWindowList = listGroup.add('listbox',undefined, '', {
                spacing: 0,
                margins: 0,
                name: 'listItem',
                multiselect: true,
                numberOfColumns: numColumns,
                showHeaders: true,
                columnTitles: columnTitles
            });
            popupWindowList.onDoubleClick = function(){
                var call = system.callSystem( 'cmd /c "explorer ' + '"' + 'C:\\' + '""' );
                alert(call)
            };
        var buttonsGroup = palette.add('group',undefined,{
            alignChildren: ['left','top'],
            orientation: 'row',
            spacing: 0,
            margins: 0
        });
        var button_copy = buttonsGroup.add('button',undefined,'Copy Directories and Their Contents');
            button_copy.onClick = button_copy_onClick;
        var button_cancel = buttonsGroup.add('button',undefined,'Cancel');
            button_cancel.onClick = button_cancel_onClick;
    }
    // Constructor
    var cls = function( ){
        this.show = function () {
            
            palette.findElement ('listItem').size = [ palette.findElement ('listItem').size[0] + 20, 600 ];
            palette.layout.layout(true);
            palette.layout.resize();
            //palette.onResizing = palette.onResize = function () { palette.layout.resize(); }
            if (!(palette instanceof Panel)) palette.show();
        }
        this.hide = function () {
            if (!(palette instanceof Panel)) palette.hide();
        }
        this.setlist = function ( inColumn1,inColumn2,inColumn3, inColumn4, inColumn5 ){
            var item = '';
            for (var i = 0; i < inColumn1.length; i++) {
                item = popupWindowList.add('item', inColumn1[i]);
                if ( numColumns >= 2 ) { item.subItems[0].text = inColumn2[i] };
                if ( numColumns >= 3 ) { item.subItems[1].text = inColumn3[i] };
                if ( numColumns >= 4 ) { item.subItems[2].text = inColumn4[i] };
                if ( numColumns >= 5 ) { item.subItems[3].text = inColumn5[i] };
            }
            palette.layout.layout(true);
        }
        this.clear = function () {
            var item = '';
            for (var i = popupWindowList.items.length-1; i > -1; i--) {
                popupWindowList.remove( popupWindowList.items[i] );
            }
            palette.layout.layout(true);
        }
    }
return cls
})(this, 'List of Footage Sources Used by This Comp', 2, ['','Found']); //popupWindow
var Collect = (function () {
    /*
    Collect Object
    Returns array of unique footage paths used in the comp. 
    
    Usage
    var collection = new Collect().init()
    
    Methods
    collection.init()       --- Collects footage items.
    
    
    Properties
    collection[i].location  --- Platform specific path to folder containing the footage item.
    collection[i].file      --- File Object
    collection[i].index     --- Project Item Index
    */

    var items = app.project.items, locations = [], indexes = [], returnObj = [], obj = {}, firstIteration = true;
    var cls = function() {
        this.init = function () {
            files = [], indexes = [], obj = {}, returnArr = [];
            for (var i = 1; i <= items.length; i++) {
                //Check if the item is a FootageItem and has a valid file
                if (items[i] instanceof FootageItem && items[i].file instanceof File) {
                    unique = false;
                   if ( firstIteration ) {
                       obj = {
                            file: items[i].file,
                            location: items[i].file.parent.fsName,
                            index: returnArr.length + 1
                        }
                        locations.push ( obj.location )
                        indexes.push ( obj.index )
                        returnArr.push ( obj );
                       
                        firstIteration = false;
                    } else {
                        if (!(returnArr.some( function( elem ){ return elem.location === items[i].file.parent.fsName }))) {
                            obj = {
                                file: items[i].file,
                                location: items[i].file.parent.fsName,
                                index: returnArr.length + 1
                            }
                            locations.push ( obj.location )
                            indexes.push ( obj.index )
                            returnArr.push ( obj );
                        }
                    }
                }
            }
        } // init()
        this.locations = function () {
            return locations
        } // paths()
        this.indexes = function () {
            return indexes
        }
    } //cls
    return cls
})() // Collect

var footageItems = new Collect();
var popup = new ListWindow();

footageItems.init();
popup.setlist( footageItems.indexes(), footageItems.locations() )
popup.show()

