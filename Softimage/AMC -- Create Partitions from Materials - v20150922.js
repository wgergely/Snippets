function init_partition(PPG_properties)
{
	/*
	SITOA - Make Partition from Material Selection - Gergely Wootsch 07/09/2015.
	Adds Arnold Visibility and Matte properties to a partition created based on selected material(s).
	The partition is overridden by the material by default or if specified below, creates a localised override ('makelocal = true').
	*/
	var makelocal_prefix = "";
	if (PPG_properties.presets == "0"){makelocal_prefix="motion"};
	if (PPG_properties.presets == "1"){makelocal_prefix="flat"};
	if (PPG_properties.presets == "2"){makelocal_prefix="uv"};
	if (PPG_properties.presets == "3"){makelocal_prefix="standard"};
	if (PPG_properties.presets == "4"){makelocal_prefix="ao"};
	var Arnold_Visibility = {
		"camera": PPG_properties.vis_camera,
		"shadows": PPG_properties.vis_shadows,
		"reflected": PPG_properties.vis_reflected,
		"refracted": PPG_properties.vis_refracted,
		"diffuse": PPG_properties.vis_diffuse,
		"glossy": PPG_properties.vis_glossy
	}
	var Arnold_Matte = {
		"camera": PPG_properties.matte_camera,
		"camera_colorR": PPG_properties.matte_camera_colorR,
		"camera_colorG": PPG_properties.matte_camera_colorG,
		"camera_colorB": PPG_properties.matte_camera_colorB,
		"camera_colorA": PPG_properties.matte_camera_colorA,
		"use_alpha": PPG_properties.matte_use_alpha,
		"use_opacity": PPG_properties.matte_use_opacity,
		"opacity": PPG_properties.matte_opacity
	}
	function apply(name, override, ray, matte, makelocal_prefix)
	{
		//Check if Pass exists already in the partition
		var check = Dictionary.GetObject(Application.ActiveProject.ActiveScene.ActivePass.fullname + "." + name,false);
		if (check)
		{
			logMessage(name + ":  Partition already exists. Skipping.",2);
			return false
		} else {
			SelectObjectsUsingMaterial("Sources.Materials.DefaultLib." + name);
			CreatePartition(Application.ActiveProject.ActiveScene.ActivePass, name, null, null);
			CopyPaste("Sources.Materials.DefaultLib." + name, null, Application.ActiveProject.ActiveScene.ActivePass + "." + name, 1);
			
			//Add SITOA_Visibility Property and Matte to Partition and Set Defaults
			if (ray)
			{
				var vis_props = SITOA_AddVisibilityProperties( Application.ActiveProject.ActiveScene.ActivePass.fullname + "." + name, true);
				for (var i=0; i<vis_props.count; i++)
				{
				   var vis_prop = vis_props.Item(i);
				   vis_prop.Parameters("camera").Value = Arnold_Visibility.camera;
				   vis_prop.Parameters("shadows").Value = Arnold_Visibility.shadows;
				   vis_prop.Parameters("reflected").Value = Arnold_Visibility.reflected;
				   vis_prop.Parameters("refracted").Value = Arnold_Visibility.refracted;
				   vis_prop.Parameters("diffuse").Value = Arnold_Visibility.diffuse;
				   vis_prop.Parameters("glossy").Value = Arnold_Visibility.glossy;
				}
			}
			if (matte)
				{
				var matte_props = SITOA_AddMatteProperties( Application.ActiveProject.ActiveScene.ActivePass.fullname + "." + name, true);
				for (var i=0; i<matte_props.count; i++)
				{
				   var matte_prop = matte_props.Item(i);
				   matte_prop.Parameters("camera").Value = Arnold_Matte.camera;
				   matte_prop.Parameters("camera_colorR").Value = Arnold_Matte.camera_colorR;
				   matte_prop.Parameters("camera_colorG").Value = Arnold_Matte.camera_colorG;
				   matte_prop.Parameters("camera_colorB").Value = Arnold_Matte.camera_colorB;
				   matte_prop.Parameters("camera_colorA").Value = Arnold_Matte.camera_colorA;
				   matte_prop.Parameters("use_alpha").Value = Arnold_Matte.use_alpha;
				   matte_prop.Parameters("use_opacity").Value = Arnold_Matte.use_opacity;
				   matte_prop.Parameters("opacity").Value = Arnold_Matte.opacity;
				}
			}
			//Add local copy of partition material
			if (override)
			{
				var a = MakeLocal(Application.ActiveProject.ActiveScene.ActivePass + "." + name + ".LocalProperties." + name, siDefaultPropagation);
				var b = String(a);
				var c = b.slice(b.lastIndexOf('.')+1);
				SetValue("Sources.Materials.DefaultLib." + c + ".Name", makelocal_prefix + "_" + name, null);		
				var d = "Sources.Materials.DefaultLib." + makelocal_prefix + "_" + name;			
				//ADD CUSTOM ACTION GOES HERE TO MODIFY THE LOCALISED MATERIAL
				if (makelocal_prefix == "standard")
				{
					try
					{	
						var opacity = get_opacitySource(d);
						var newShader = CreateShaderFromProgID("ArnoldCoreShaders.standard.1.0", d, "standard");
						SIConnectShaderToCnxPoint(newShader.fullname + ".out", d + ".surface", false);
						SIConnectShaderToCnxPoint(opacity, newShader.fullname + ".opacity", false);
						
						SetValue(newShader.fullname + ".Kd", 1, null);				
						SetValue(newShader.fullname + ".Fresnel_affect_diff", false, null);
						
						RemoveAllShadersFromCnxPoint(d +".shadow", siShaderCnxPointBasePorts);
						RemoveAllShadersFromCnxPoint(d +".photon", siShaderCnxPointBasePorts);
					} catch(e) {
						logMessage(e,siError)
					}					
				}
				if (makelocal_prefix == "flat")
				{
					try
					{
						var opacity = get_opacitySource(d);
						var newShader = CreateShaderFromProgID("ArnoldCoreShaders.utility.1.0", d, "utility");
						SIConnectShaderToCnxPoint(newShader.fullname + ".out", d + ".surface", false);
						SIConnectShaderToCnxPoint(opacity, newShader.fullname + ".opacity", false);

						SetValue(newShader.fullname + ".color.blue", 0, null);
						SetValue(newShader.fullname + ".color.green", 0, null);
						SetValue(newShader.fullname + ".color.red", 0, null);
						SetValue(newShader.fullname + ".shade_mode", "flat", null);
						
						RemoveAllShadersFromCnxPoint(d +".shadow", siShaderCnxPointBasePorts);
						RemoveAllShadersFromCnxPoint(d +".photon", siShaderCnxPointBasePorts);
					} catch(e) {
						logMessage(e,siError)
					}
				}
				if (makelocal_prefix == "motion")
				{
					try
					{	
						var opacity = get_opacitySource(d);
						var motionShader = CreateShaderFromProgID("ArnoldCoreShaders.motion_vector.1.0", d, "motion_vector");
						var newShader = CreateShaderFromProgID("ArnoldCoreShaders.utility.1.0", d, "utility");
						SIConnectShaderToCnxPoint(newShader.fullname + ".out", d + ".surface", false);
						SetValue(newShader.fullname + ".shade_mode", "flat", null);
						
						SIConnectShaderToCnxPoint(opacity, newShader.fullname + ".opacity", false);
						SIConnectShaderToCnxPoint(motionShader.fullname, newShader.fullname + ".color", false);
						
						SetValue(motionShader.fullname + ".raw", true, null);
						SetValue(motionShader.fullname + ".time0", 0, null);
						SetValue(motionShader.fullname + ".time1", 1, null);
						
						RemoveAllShadersFromCnxPoint(d +".shadow", siShaderCnxPointBasePorts);
						RemoveAllShadersFromCnxPoint(d +".photon", siShaderCnxPointBasePorts);
					} catch(e) {
						logMessage(e,siError)
					}
				}
				if (makelocal_prefix == "uv")
				{
					try
					{						
						var opacity = get_opacitySource(d);
						var newShader = CreateShaderFromProgID("ArnoldCoreShaders.utility.1.0", d, "utility");
						SIConnectShaderToCnxPoint(newShader.fullname + ".out", d + ".surface", false);
						SIConnectShaderToCnxPoint(opacity, newShader.fullname + ".opacity", false);

						SetValue(newShader.fullname + ".color.blue", 0, null);
						SetValue(newShader.fullname + ".color.green", 0, null);
						SetValue(newShader.fullname + ".color.red", 0, null);
						SetValue(newShader.fullname + ".shade_mode", "flat", null);
						SetValue(newShader.fullname + ".color_mode", "uv", null);
						
						RemoveAllShadersFromCnxPoint(d +".shadow", siShaderCnxPointBasePorts);
						RemoveAllShadersFromCnxPoint(d +".photon", siShaderCnxPointBasePorts);
					} catch(e) {
						logMessage(e,siError)
					}
				}
				if (makelocal_prefix == "ao")
				{
					try
					{
						var opacity = get_opacitySource(d);
						var newShader = CreateShaderFromProgID("ArnoldCoreShaders.utility.1.0", d, "utility");
						SIConnectShaderToCnxPoint(newShader.fullname + ".out", d + ".surface", false);
						SIConnectShaderToCnxPoint(opacity, newShader.fullname + ".opacity", false);

						SetValue(newShader.fullname + ".color.blue", 0, null);
						SetValue(newShader.fullname + ".color.green", 0, null);
						SetValue(newShader.fullname + ".color.red", 0, null);
						SetValue(newShader.fullname + ".shade_mode", "flat", null);
						SetValue(newShader.fullname + ".color_mode", "uv", null);
						
						RemoveAllShadersFromCnxPoint(d +".shadow", siShaderCnxPointBasePorts);
						RemoveAllShadersFromCnxPoint(d +".photon", siShaderCnxPointBasePorts);
					} catch(e) {
						logMessage(e,siError)
					}
				}
			}
			return true
		}
	}

	function get_opacitySource(materialName){
		var opacityShaderOut;
		var src = Dictionary.GetObject(materialName).surface.Source.fullname;
		try
		{
			var opacitySrc = Dictionary.GetObject(src.slice(0,src.lastIndexOf('.')));
			if (opacitySrc.opacity.source != undefined)
			{
				var o = opacitySrc.opacity.source.fullname;
				var opacityShader = Dictionary.GetObject(o.slice(0,o.lastIndexOf('.')));
				// 3 = Scalar, 4 = Color
				if (opacityShader.OutputType == 3)
				{
					opacityShaderOut = Dictionary.GetObject(opacityShader.input.source.fullname.slice(0,opacityShader.input.source.fullname.lastIndexOf('.'))).out.fullname;
				}
				if (opacityShader.OutputType == 4)
				{
					opacityShaderOut = opacityShader.out.fullname;
				}
			} 
			else
			{
				opacityShaderOut = undefined;
			}
		} catch(e) {
			opacityShaderOut = undefined;
		}
		return opacityShaderOut;
	}

	var names = [];
	function push()
	{
		var names = [];
		var sel = application.selection;
		for  ( i=0; i < sel.count; i++){ names.push(sel(i).name)}
		return names
	}
	var names = push();
	for (i=0; i < names.length; i++)
	{
		//apply(name, override, ray, matte, makelocal_prefix)
		apply(names[i], PPG_properties.override, PPG_properties.ray, PPG_properties.matte, makelocal_prefix);
	}
}

function init(){
	var paramSet=ActiveSceneRoot.AddProperty("CustomProperty",false,"CreateMaterialBasedPartition") ;
	function init_layout(PPG,override,preset,ray,matte)
	{	
		var xsiLayout = PPG.PPGLayout;	
		xsiLayout.Clear();
		
		xsiLayout.AddRow();
			xsiLayout.AddButton("create","Create Partition(s)");
		xsiLayout.EndRow();
		xsiLayout.AddSpacer( 10,5 )
		
		PPG.AddParameter2("override",	siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter3("presets", 	siInt4, 4 ) ;
		PPG.override = override;
		PPG.presets = preset;
		xsiLayout.AddItem("override", "Add Material Override");
		if(override)
		{
			xsiLayout.AddGroup( "Partition Material Override", true, 50 );
				xsiLayout.AddEnumControl( "presets", new Array( "Arnold_Motion_Vectors", "0", "Utility_Flat", "1", "Utility_UV", "2", "Standard", "3" , "Ambient_Occlusion", "4" ), "Choose Preset",  siControlCombo );
			xsiLayout.EndGroup();
			}
		// Partition Ray Visibility
		PPG.AddParameter2("ray",    siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.ray = ray;
		PPG.AddParameter2("vis_camera",    siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter2("vis_shadows",   siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter2("vis_reflected", siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter2("vis_refracted", siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter2("vis_diffuse",   siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter2("vis_glossy",    siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		xsiLayout.AddItem("ray",      "Add Ray Visibility Property");
		if (ray)
		{
			xsiLayout.AddGroup( "Partition Ray Visibility", false, 50 );
				xsiLayout.AddItem("vis_camera",      "Camera");
				xsiLayout.AddItem("vis_shadows",     "Shadow");
				xsiLayout.AddItem("vis_reflected",   "Reflected");
				xsiLayout.AddItem("vis_refracted",   "Refracted");
				xsiLayout.AddItem("vis_diffuse",     "Diffuse");
				xsiLayout.AddItem("vis_glossy",      "Glossy");
			xsiLayout.EndGroup();
		}
		//Matte
		PPG.AddParameter2("matte",    siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter2("matte_camera",    siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter2("matte_camera_colorR", siDouble, 0.0, 0, 1, 0, 1,siClassifUnknown,siPersistable | siKeyable);
		PPG.AddParameter2("matte_camera_colorG", siDouble, 0.0, 0, 1, 0, 1,siClassifUnknown,siPersistable | siKeyable);
		PPG.AddParameter2("matte_camera_colorB", siDouble, 0.0, 0, 1, 0, 1,siClassifUnknown,siPersistable | siKeyable);
		PPG.AddParameter2("matte_camera_colorA", siDouble, 1.0, 0, 1, 0, 1,siClassifUnknown,siPersistable | siKeyable);
		PPG.AddParameter2("matte_use_alpha",      siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter2("matte_use_opacity",    siBool, 1, 0, 1, 0, 5, 0, siPersistable|siAnimatable);
		PPG.AddParameter2("matte_opacity",        siDouble, 1.0, 0, 1, 0, 1,siClassifUnknown,siPersistable | siKeyable);
		xsiLayout.AddItem("matte", "Add Matte Property");
		PPG.matte = matte;
		PPG.matte_camera_colorR = 0;
		PPG.matte_camera_colorG = 0;
		PPG.matte_camera_colorB = 0;
		PPG.matte_camera_colorA = 0;
		PPG.matte_use_alpha = true;
		PPG.matte_use_opacity = false;
		if (matte)
		{
			xsiLayout.AddGroup( "Partition Matte Options", true, 50 );
				xsiLayout.AddItem("matte_camera",                  "On");
				xsiLayout.AddColor("matte_camera_colorR",    "Color", true);
				xsiLayout.AddGroup("Alpha/Opacity ", true, 50);
				  xsiLayout.AddItem("matte_use_alpha",   "Override Alpha");
				  xsiLayout.AddRow();
					 xsiLayout.AddItem("matte_use_opacity", "Override Opacity");
					 xsiLayout.AddItem("matte_opacity",     "Opacity");
				  xsiLayout.EndRow();
				xsiLayout.EndGroup();
			xsiLayout.EndGroup();
		}
	}
	init_layout(paramSet,false,0,false)
	//Event Handlers
	paramSet.PPGLayout.Logic = init_partition.toString() + "\n;" + init_layout.toString() + "\n;" + override_OnChanged.toString() + "\n;" + ray_OnChanged.toString() + "\n;" + matte_OnChanged.toString() + "\n;" +  create_OnClicked.toString();
	paramSet.PPGLayout.Language = "JScript";
	function override_OnChanged()
	{
		init_layout(PPG.Inspected.Item(0),PPG.override.Value,PPG.presets.Value,PPG.ray.Value,PPG.matte.Value);
		PPG.Refresh();
	}
	function ray_OnChanged()
	{
		init_layout(PPG.Inspected.Item(0),PPG.override.Value,PPG.presets.Value,PPG.ray.Value,PPG.matte.Value);
		PPG.Refresh();
	}
	function matte_OnChanged()
	{
		init_layout(PPG.Inspected.Item(0),PPG.override.Value,PPG.presets.Value,PPG.ray.Value,PPG.matte.Value);
		PPG.Refresh();
	}
	function create_OnClicked()
	{
		function check_selection()
		{
			var valid = false;
			var s = application.selection;
			for (var i=0; i < s.count; i++){if (s(i).type != "material"){valid = false}else{valid = true}}
			return valid
		}
		if (check_selection())
		{
			var PPG_properties = {
				"override" : PPG.override.Value,
				"presets" : PPG.presets.Value,
				"ray" : PPG.ray.Value,
				"vis_camera" : PPG.vis_camera.Value,
				"vis_shadows" : PPG.vis_shadows.Value,
				"vis_reflected" : PPG.vis_reflected.Value,
				"vis_refracted" : PPG.vis_refracted.Value,
				"vis_diffuse" : PPG.vis_diffuse.Value,
				"vis_glossy" : PPG.vis_glossy.Value,
				"matte" : PPG.matte.Value,
				"matte_camera" : PPG.matte_camera.Value,
				"matte_camera_colorR" : PPG.matte_camera_colorR.Value,
				"matte_camera_colorG" : PPG.matte_camera_colorG.Value,
				"matte_camera_colorB" : PPG.matte_camera_colorB.Value,
				"matte_camera_colorA" : PPG.matte_camera_colorA.Value,
				"matte_use_alpha" : PPG.matte_use_alpha.Value,
				"matte_use_opacity" : PPG.matte_use_opacity.Value,
				"matte_opacity" : PPG.matte_opacity.Value
			}
			init_partition(PPG_properties)
		} else {
			XSIUIToolkit.MsgBox( "Invalid selection. \nPlease select only materials.", siMsgExclamation , "Create Material Based Partitions")
		};
	}
	return paramSet
}

try {
	var prop = Dictionary.GetObject( "CreateMaterialBasedPartition", false );
	if (!prop)
	{
		prop = init();
		InspectObj( prop, "", "Create Partition from Material (Arnold)", siLock );
	} else {
		InspectObj( prop, "", "Create Partition from Material (Arnold)", siLock );
	}
} catch( e ) {
	logMessage(e, siErrorMsg)
}