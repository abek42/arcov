Task 1: Wash your hands
Scene start with 3 floating viruses [INFRA: Virus model]
Once a tap-marker is found, a tap is added to the scene, controlled by the marker [INFRA: Tap model]
Every time a virus touches the tap, the virus drops down out of the scene and removed
One new virus is added every 5 seconds. [CORE: orbital mechanics]
Once 10 viruses have been destroyed, replication stops
Once all viruses are removed, level is completed
If virus count reaches 3, auto-spawn unless replication is disabled
If virus count exceeds 10, level is lost
Banner: Wash your hands with soap, for at least 20 seconds

Task 2: Don't touch your face
Scene starts with two hands moving right and left. [INFRA: Hand model]
Once body-marker is found, an emoji face is added to the scene, controlled by the marker [INFRA: Face]
The hands move right and left 5 times each direction, and once a hand reaches extremity, the z-depth is matched to marker
Once 5 iterations are completed, each hand disappears
If the hand touches the face, another pair is added.
If total pairs reach 10, level is lost
Banner: Avoid touching your face

Both tasks successfully completed, excited face, repeat banner and link to NHS website
Either task successfully completed, sad face, repeate banner and link to NHS website
Both tasks failed, sick face, maybe you would like to retry, and link to NHS website

Models:
Virus 	: Build
Tap 	: Build
Hand	: Download/Build?
Face    : Build

Mechanics:
Move end to end 5 times and then disappears
Float around in an oval orbit