
/*

ProjectIO
v.0.1.0
Copyright (c) 2015 Gergely Wootsch <hello@gergely-wootsch.com>
ARRAY OF RENDER TOOLS USED OFTEN IN PRODUCTION.

*/ 

//encapsulate the script in a function to avoid global variables
(function (thisObj) {
    
    // ================ MAIN APP OBJECT=================
    {
        // ======= Main App Object =========
        var ProjectIO = {};
        ProjectIO.version = '0.1.0';
        ProjectIO.script = new File ($.fileName);
        ProjectIO.psexec = function(inPath) {
            var psexec = new File (this.script.parent.fullName + '/psexec/PsExec.exe');
            if (inPath) {
                var cmd = '\"' + psexec.fsName + '\" -d -accepteula ' + inPath;
                var call = system.callSystem( cmd );
                var PID = call.slice(call.lastIndexOf('ID')+3).slice(0, -3);
                return PID;
            };
            return psexec
        };
        ProjectIO.pskill = function(inPID){
            var pskill = new File (this.script.parent.fullName + '/psexec/pskill.exe');
            if (inPID) {
                var cmd = '\"' + pskill.fsName + '\" -t -accepteula ' + inPID;
                var call = system.callSystem( cmd );
                return call
            }
        };
        ProjectIO.serverPath = '\\\\GORDO\\Jobs';
        ProjectIO.aerender = {
            PID: {
                localhost: null
            },
            file: (function(){
                var aerender;
                var ver = app.version.slice(0,4);
                if (ver === '13.5' || ver === '13.0'){
                    aerender = new File ('/c/Program Files/Adobe/Adobe After Effects CC 2015/Support Files/aerender.exe');
                }
                if (ver === '12.5' || ver === '12.0'){
                    aerender = new File ('/c/Program Files/Adobe/Adobe After Effects CC 2014/Support Files/aerender.exe');
                }
                if (ver === '11.5' || ver === '11.0'){
                    aerender = new File ('/c/Program Files/Adobe/Adobe After Effects CC/Support Files/aerender.exe');
                }
                return aerender
            })()
        };
        //================
    }
    //==================================================
    // ================ EVENT FUNCTIONS ================
    {
        function button_start_onClicked()
        {
            var jobString = '"' + ProjectIO.aerender.file.fsName + '" -project "' + path( app.project.file.fsName, ProjectIO.serverPath ) + '"';
            ProjectIO.aerender.PID.localhost = ProjectIO.psexec( jobString );            
            function path(inPath, server) {
                    try{
                        var path = inPath;
                        path = server + path.slice(path.lastIndexOf(':\\') + 1)
                    }catch(e){alert(e)}
                    return path
            }
            function makeFile(inString){
                var bat = new File(app.project.file.parent.fullName + "/" + app.project.file.name + ".bat");
                //bat = bat.saveDlg('Select Location to Save Job File',  "Batch:*.bat");
                
                var title = 'Started by ' + system.userName + ' on ' + system.machineName;
                var cmd = 'start \"' + title + '" /b' + ' ' + jobString;
                
                bat.open('w:');
                bat.write( '@echo off\n' + cmd + '\nExit /B 0' );
                bat.close('w');
                
                return bat
            }
            function callAEBat( inFile )
            {   
                var title = 'Started by ' + system.userName + ' on ' + system.machineName;
                var cmd = 'start \"' + title + '"' + ' \"' + path( inFile.fsName, ProjectIO.serverPath) + '\"';
                var call = ProjectIO.psexec( cmd );
                ProjectIO.aerender.PID.localhost = call;
                return call
            }
        } //button_start_onClicked()
        function button_stop_onClicked()
        {
            var call = ProjectIO.pskill( ProjectIO.aerender.PID.localhost );
        } //button_start_onClicked()
        function button_inspect_onClicked()
        {
            function getOMFiles() {
                var rq = app.project.renderQueue,
                files = [],
                file,
                warning = false;
                status;
                
                for (var i = 1; i <= rq.numItems; i++) {
                    status = rq.item(i).status;
                    for (var j = 1; j <= rq.item(i).numOutputModules; j++) {
                        file = rq.item(i).outputModule(j).file;
                        if (status == '2815'){ files.push( file ) }
                        if ( !(decodeURI( file.name ).match(/\[####\]/g)) ) {
                            warning = true;
                        }
                    };
                }
                if (warning) {
                    alert("Note: Sequence padding is not set to [####].\nIt is recommended to set padding to '[####]' for uniform sequence numbering across the pipeline.", 'ProjectIO')
                }
                return files;
            }
            function inspect() {
                var files = getOMFiles(),
                file,
                folder,
                extension;
                
                for (var i = 0; i < files.length; i++)
                {
                    file = null;
                    folder = null;
                    file = files[i];
                    fileExt = file.type;
                    folder = new File ( file.parent.fullName );
                    /*
                    /select,<sub object>:  Specifies the folder to receive the initial
                       focus. If "/select" is used, the parent folder
                       is opened and the specified object is selected.    
                    */
                    if (folder.exists) {
                        var cmd = 'explorer "' + folder.fsName + '"';
                        var call = ProjectIO.psexec( cmd );
                    }
                }
            }
            inspect()
        } //button_inspect_onClicked()
        function button_renderfiles_onClicked()
        {
            
            function removeSequenceItemsUI(thisObj) {
                //Event Functions
                {
                    var om = {};
                        om.items = (function() {
                            
                            objs = [];
                            
                            
                            //Helper Functions
                            function getPadding( inString ){
                                var match = decodeURI(inString).match(/\[#\]|\[##\]|\[###\]|\[####\]|\[#####\]|\[######\]/g);
                                if (match){
                                    return (match[0].length - 2)   
                                } else {
                                    return null
                                }
                            }
                            function pad(num, size) {var s = num+"";while (s.length < size) s = "0" + s;return s;}
                            
                            var p = app.project,rqItem,omItem,parent = null;
                            
                            //Collect Info
                            if (p.file) {
                                for (var i = 1; i <= p.renderQueue.numItems; i++) {
                                    for (var j = 1; j <= p.renderQueue.item(i).numOutputModules; j++) {
                                        
                                        omItem = p.renderQueue.item(i).outputModule(j);
                                        rqItem = p.renderQueue.item(i);
                                        
                                        // ===== obj{} / objs[] =======
                                        obj = {
                                            file: null,
                                            filename: null,
                                            result: {
                                                isComplete: null,
                                                renderedframes: null,
                                                missingframes: null,
                                                incompleteframes: null,
                                                getStatus: function ( inRQItem, inOMItem ) {
                                                    var oneframe = inRQItem.comp.frameDuration,
                                                        startframe = Math.round((inRQItem.timeSpanStart / oneframe) + (inRQItem.comp.displayStartTime / oneframe)),
                                                        endframe = Math.round((inRQItem.timeSpanStart + inRQItem.timeSpanDuration) /  oneframe) + (inRQItem.comp.displayStartTime / oneframe) - 1,
                                                        duration = Math.round((inRQItem.timeSpanStart + inRQItem.timeSpanDuration) /  oneframe),
                                                        file = new File(''),
                                                        padding,
                                                        missing = [],
                                                        rendered = [],
                                                        incomplete = [];

                                                    for (var i = 0; i < duration; i++) {
                                                        padding = getPadding( inOMItem.file.name );
                                                        ext = inOMItem.file.name.slice(-4);
                                                        file.changePath( inOMItem.file.parent.fullName + '/' + encodeURI( decodeURI(inOMItem.file.name).slice(0, ((padding + 2 + 4) * (-1)) )) + pad(startframe + i, padding) + ext);
                                                        if (!file.exists) {
                                                            missing.push( file );
                                                        }
                                                        if (file.exists && file.length > 0) {
                                                            rendered.push( file );
                                                        }
                                                        if (file.exists && file.length === 0) {
                                                            incomplete.push( file );
                                                        }
                                                        
                                                    };

                                                    if (missing.length === 0) {
                                                        obj.result.isComplete = true;
                                                    } else {
                                                        obj.result.isComplete = false;
                                                    }
                                                    obj.result.renderedframes = rendered;
                                                    obj.result.missingframes = missing;
                                                    obj.result.incompleteframes = incomplete;
                                                    return true;
                                                }
                                            },
                                            comp: null
                                        }; // obj{}
                                        obj.file = omItem.file;
                                        obj.filename = decodeURI ( omItem.file.parent.name + '/' + omItem.file.name );
                                        obj.comp = rqItem.comp;
                                        obj.result.getStatus( rqItem, omItem );
                                        //PUSH IT PUSH PUSH IT REAL HARD
                                        objs.push( obj );
                                    }
                                }
                                return objs
                            };
                        })();
                        om.item = function(index){
                            return om.items[index-1];
                        };
                        om.filename = (function() {
                            if (om.items.length === 0) { return 'No active output modules found.' } else {
                                var arr = [];
                                for (var i = 0; i < om.items.length; i++) {
                                    arr.push(om.items[i].filename);
                                }
                                return arr
                            }
                        })();
                        om.compname = (function() {
                            if (om.items.length === 0) { return '' } else {
                                var arr = [];
                                for (var i = 0; i < om.items.length; i++) {
                                    arr.push(om.items[i].comp.name);
                                }
                                return arr
                            }
                        })();
                        om.status = (function() {
                            if (om.items.length === 0) { return '' } else {
                                var arr = [];
                                for (var i = 0; i < om.items.length; i++) {
                                    arr.push(om.items[i].result.isComplete);
                                }
                                return arr
                            }
                        })();
                        om.missing = (function() {
                            if (om.items.length === 0) { return '' } else {
                                var arr = [];
                                for (var i = 0; i < om.items.length; i++) {
                                    arr.push(om.items[i].result.missingframes.length);
                                }
                                return arr
                            }
                        })();
                        om.rendered = (function() {
                            if (om.items.length === 0) { return '' } else {
                                var arr = [];
                                for (var i = 0; i < om.items.length; i++) {
                                    arr.push(om.items[i].result.renderedframes.length);
                                }
                                return arr
                            }
                        })();
                        om.incomplete = (function() {
                            if (om.items.length === 0) { return '' } else {
                                var arr = [];
                                for (var i = 0; i < om.items.length; i++) {
                                    arr.push(om.items[i].result.incompleteframes.length);
                                }
                                return arr
                            }
                        })();
                    //setOMAttributes()
                    function button_close_onClick()
                    {
                        mainPalette.close();
                    } //button_close_onClick()
                    function validateInput()
                    { 
                        var valid = this.text.replace(/\D+/g, '');
                        if (valid.length > 4) {
                            this.text = valid.slice(0,-1);
                        } else {
                            this.text = valid;
                        }
                    }
                    function padInput()
                    {
                        this.text = pad(this.text, 4);
                    }
                    
                }
                //UI Definition
                {
                    var mainPalette = thisObj instanceof Panel ? thisObj : new Window('dialog','Remove Sequence Items',undefined, {resizeable:false});
                    if (mainPalette == null) return;
                    mainPalette.alignChildren = ['fill','fill'];
                    mainPalette.margins = 12;
                    mainPalette.spacing = 6;
                }
                //Build UI
                {
                    function columnWidth(inArr, scale){
                        var width = 0;
                        for (var i = 0; i < inArr.length; i++) {
                            if (inArr[i].length > width){
                                width = inArr[i].length;
                            }
                        }
                        return width * scale;
                    }
                    function addListItems( inList, inColumn1,inColumn2,inColumn3, inColumn4 ){
                        var item = '';
                        for (var i = 0; i < inColumn1.length; i++) {
                            item = inList.add('item', inColumn1[i]);
                            item.subItems[0].text = inColumn2[i];
                            if (inColumn3[i] === 0) { item.subItems[1].text = ''; item.enabled = false; } else { item.subItems[1].text = 'Δ' + inColumn3[i] };
                            if (inColumn4[i] === 0) { item.subItems[2].text = ''  } else { item.subItems[2].text = 'Δ' + inColumn4[i] };
                        }
                    }
                    var outputModules = mainPalette.add('group', undefined,{});
                        var omlist = outputModules.add('listbox',undefined, '', {
                            name: 'omlist',
                            multiselect: true,
                            numberOfColumns: 4,
                            showHeaders: true,
                            columnTitles: ['Comp Name','File Name', 'Rendered', 'Empty/Missing'],
                            //columnWidths: [columnWidth(om.compname, 10), columnWidth(om.filename, 10), 20, 20]
                        });
                        omlist.onDoubleClick = function(){
                            alert( this.selection[0].index );
                        };
                        
                        addListItems( omlist, om.compname, om.filename, om.rendered, om.missing );

                    var buttons = mainPalette.add('group');
                        buttons.alignChildren = ['left','fill'];
                        buttons.orientation = 'row';
                        buttons.margins = 10;
                        buttons.spacing = 2;
                        var check_deleteall = buttons.add('checkbox',undefined,'');
                            check_deleteall.onClick = function()
                            {
                                button_deleteall.enabled = this.value;
                                check_deleterange.value = false;
                                button_deleterange.enabled = false;
                                inputRangeIn.enabled = false;
                                inputRangeOut.enabled = false;
                            }
                        var button_deleteall = buttons.add('button',undefined,'Remove All Frames');
                            button_deleteall.enabled = false;
                        var check_deleterange = buttons.add('checkbox',undefined,'');
                            check_deleterange.onClick = function()
                            {
                                button_deleterange.enabled = this.value;
                                button_deleteall.enabled = false;
                                check_deleteall.value = false;
                                inputRangeIn.enabled = this.value;
                                inputRangeOut.enabled = this.value;
                            }
                        var button_deleterange = buttons.add('button',undefined,'Remove Frames in Range: ');
                            button_deleterange.enabled = false;
                        var inputRangeIn = buttons.add('edittext',undefined,'');
                            inputRangeIn.enabled = false;
                            inputRangeIn.onChanging = validateInput;
                            inputRangeIn.onChange = padInput;
                            inputRangeIn.characters = 5;
                            inputRangeIn.text = '0';
                        var inputRangeOut = buttons.add('edittext',undefined,'');
                            inputRangeOut.enabled = false;
                            inputRangeOut.characters = 5;
                            inputRangeOut.text = '0';
                            inputRangeOut.onChanging = validateInput;
                            inputRangeOut.onChange = padInput;
                        var check_deleteinput = buttons.add('checkbox',undefined,'');
                        var button_deleteinput = buttons.add('button',undefined,'Remove Custom Frames');
                            button_deleteinput.enabled = false;
                        var input_customframes = buttons.add('edittext',undefined,'');
                        input_customframes.characters = 15;
                        input_customframes.text = '0-15,17';

                    var apply = mainPalette.add('group');
                        apply.alignChildren = ['left','top'];
                        apply.orientation = 'row';
                        apply.margins = 0;
                        apply.spacing = 2;
                    var button_close = apply.add('button',undefined,'Remove');
                        button_close.onClick = button_close_onClick;
                }
                //Show UI
                {
                    mainPalette.layout.layout(true);
                    mainPalette.layout.resize();
                    mainPalette.onResizing = mainPalette.onResize = function () {
                        mainPalette.layout.resize();
                    }
                    if (!(mainPalette instanceof Panel)) mainPalette.show();
                }
            }

            var rtn = removeSequenceItemsUI(this);
        } //button_renderfiles_onClicked()  
    }
    //==================================================
    
    // _______ UI SETUP _______
    {
        // if the script is a Panel, (launched from the 'Window' menu), use it,
        // else (launched via 'File/Scripts/Run script...') create a new window
        // store it in the variable mainPalette
        var mainPalette = thisObj instanceof Panel ? thisObj : new Window('palette','ProjectIO',undefined, {resizeable:true});

        //stop if there's no window
        if (mainPalette == null) return;
           
        // set margins and alignment
        mainPalette.alignChildren = ['fill','fill'];
        mainPalette.margins = 5;
        mainPalette.spacing = 2;
    }
    //__________________________
    
    // ============ UI DEFINITION =================
    {
        var content = mainPalette.add('group');
        content.alignChildren = ['left','top'];
        content.orientation = 'row';
        content.margins = 0;
        content.spacing = 2;
        //content.add('statictext',undefined,'the script!');
        var button_start = content.add('button',undefined,'Start Render');
            button_start.size = [76, 24];
            button_start.onClick = button_start_onClicked;
        var button_stop = content.add('button',undefined,'Stop Render');
            button_stop.size = [76, 24];
            button_stop.onClick = button_stop_onClicked;
        var button_inspect = content.add('iconbutton');
            button_inspect.image = File( ProjectIO.script.parent.fullName + '/icons/iconInspect.png');
            button_inspect.size = [36,24];
            button_inspect.onClick = button_inspect_onClicked;
        var button_renderfiles = content.add('iconbutton');
            button_renderfiles.image = File( ProjectIO.script.parent.fullName + '/icons/iconRemove.png');
            button_renderfiles.size = [36,24];
            button_renderfiles.onClick = button_renderfiles_onClicked;
    }
    // ==================================================
    
    //__________ SHOW UI ___________
    {
        // Set layout, and resize it on resize of the Panel/Window
        mainPalette.layout.layout(true);
        mainPalette.layout.resize();
        mainPalette.onResizing = mainPalette.onResize = function () {mainPalette.layout.resize();}
        //if the script is not a Panel (launched from 'File/Scripts/Run script...') we need to show it
        if (!(mainPalette instanceof Panel)) mainPalette.show();
    }
    //______________________________
    
})(this);