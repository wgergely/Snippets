@ECHO OFF 
	
:: via http://ss64.com/nt/for_l.html

:SEQUENCE_VARIABLES
set FRAME_IN=1
set FRAME_OUT=5

:: AE RENDERPATH


SET JOBSFOLDER=\\hero\Jobs
SET JOB=Sky - Penny Dreadful
SET SCENEPOOL=%JOBSFOLDER%\%JOB%\05_ANIMATION\02_DRACULA
SET PROJECTPREFIX=SKY_PD_EP02
SET scene=%PROJECTPREFIX%_SH010
SET SCENEPATH2=%SCENEPOOL%\%scene%\Scenes\02_AE

SET AEOUTPUT=Render_Pictures\00_AEOUTPUT\

SET COMPNAME=%PROJECTPREFIX%_SH010_MAINCOMP

:ARCHIVE_SEQUENCE
:: SET PADDED NUMBERS
SetLocal EnableDelayedExpansion
for /L %%n in (%FRAME_IN% 1 %FRAME_OUT%) do (
  set "num=000%%n"
  set "num=!num:~-4!"
  set SEQUENCE=%COMPNAME%_!num!
  echo ARCHIVING "%SCENEPOOL%\%SCENE%\%AEOUTPUT%\%COMPNAME%_!num!.png"
  MOVE /Y "%SCENEPOOL%\%scene%\%AEOUTPUT%\%COMPNAME%_!num!.png" "%SCENEPOOL%\%scene%\%AEOUTPUT_ARCHIVE%"
  )
EndLocal
pause

