#pragma strict

private var prcRev : PRCReverb;
private var nRev : NReverb;

private var effector = 0;
private var decayTime = 2.0;
private var wetMix = 0.2;

function Awake() {
	prcRev = FindObjectOfType(PRCReverb);
	nRev = FindObjectOfType(NReverb);
}

function SelectClip(index : int) {
	var audioSources = GetComponents.<AudioSource>();
	for (var i = 0; i < 3; i++) {
		audioSources[i].volume = (i == index) ? 1 : 0;
	}
}

function Update() {
	prcRev.enabled = (effector == 0);
	nRev.enabled = (effector == 1);
	prcRev.decayTime = nRev.decayTime = decayTime;
	prcRev.wetMix = nRev.wetMix = wetMix;
}

function OnGUI() {
	GUILayout.BeginArea(Rect(16, 16, Screen.width - 32, Screen.height - 32));
	GUILayout.FlexibleSpace();
	
	GUILayout.Label("Audio sources");
	GUILayout.BeginHorizontal();
	if (GUILayout.Button("Click tone")) SelectClip(0);
	if (GUILayout.Button("Acoustic drums")) SelectClip(1);
	if (GUILayout.Button("Synth drum loop")) SelectClip(2);
	GUILayout.EndHorizontal();
	
	GUILayout.FlexibleSpace();

	GUILayout.Label("Reverb type (current: " + (effector == 0 ? "PRCReverb" : "NReverb") + ")");
	GUILayout.BeginHorizontal();
	if (GUILayout.Button("PRCReverb")) effector = 0;
	if (GUILayout.Button("NReverb")) effector = 1;
	GUILayout.EndHorizontal();
	
	GUILayout.FlexibleSpace();

	GUILayout.Label("Decay time = " + decayTime.ToString("0.00") + " sec");
	decayTime = GUILayout.HorizontalSlider(decayTime, 0.0, 10.0);

	GUILayout.FlexibleSpace();

	GUILayout.Label("Wet mix = " + (wetMix * 100).ToString("0") + " %");
	wetMix = GUILayout.HorizontalSlider(wetMix, 0.0, 1.0);
	
	GUILayout.FlexibleSpace();
	GUILayout.EndArea();
}
