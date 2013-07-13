#pragma strict

// Perry's simple reveberator class, based on PRCRev in CCRMA STK library.
// https://ccrma.stanford.edu/software/stk

@Range(0.0, 10.0)
var reverbTime = 1.0;

@Range(0.0, 1.0)
var wetMix = 0.5;

private var bufferSize = 32 * 1024;
private var bufferSizeBits = bufferSize - 1;

private var passBuffer1 : float[];
private var passBuffer2 : float[];
private var combBuffer1 : float[];
private var combBuffer2 : float[];

private var position = 0;

private var passDelay1 = 0;
private var passDelay2 = 0;
private var combDelay1 = 0;
private var combDelay2 = 0;

private var passCoeff = 0.7;
private var combCoeff1 = 0.0;
private var combCoeff2 = 0.0;

private var error = "";

private function UpdateParameters() {	
	var sampleRate = AudioSettings.outputSampleRate;
	combCoeff1 = Mathf.Pow(10.0, (-3.0 * combDelay1 / (reverbTime * sampleRate)));
	combCoeff2 = Mathf.Pow(10.0, (-3.0 * combDelay2 / (reverbTime * sampleRate)));
}

function Awake() {
	passBuffer1 = new float[bufferSize];
	passBuffer2 = new float[bufferSize];
	combBuffer1 = new float[bufferSize];
	combBuffer2 = new float[bufferSize];
	
	// Delay length for 44100 Hz sample rate.
	var delays = [341, 613, 1557, 2137];

	// Scale the delay lengths if necessary.
	var sampleRate = AudioSettings.outputSampleRate;
	if (sampleRate != 44100) {
		var scaler = sampleRate / 44100.0;
		for (var i = 0; i < delays.Length; i++) {
			var delay = Mathf.FloorToInt(scaler * delays[i]);
			if ((delay & 1) == 0) delay++;
			// while (!IsPrime(delay)) delay += 2;
			delays[i] = delay;
		}
	}
	
	passDelay1 = (bufferSize - delays[0]) & bufferSizeBits;
	passDelay2 = (bufferSize - delays[1]) & bufferSizeBits;
	combDelay1 = (bufferSize - delays[2]) & bufferSizeBits;
	combDelay2 = (bufferSize - delays[3]) & bufferSizeBits;
	
	UpdateParameters();
}

function Update() {
	if (error) {
		Debug.LogError(error);
		Destroy(this);
	} else {
		UpdateParameters();
	}
}

function OnAudioFilterRead(data:float[], channels:int) {
	if (channels != 2) {
		error = "This filter only supports stereo audio (given:" + channels + ")";
		return;
	}

	for (var i = 0; i < data.Length; i += 2) {
		var input = 0.5 * (data[i] + data[i + 1]);
		
		var temp = passBuffer1[passDelay1];
		var temp0 = passCoeff * temp;
		temp0 += input;
		passBuffer1[position] = temp0;
		temp0 = temp - passCoeff * temp0;
		
		temp = passBuffer2[passDelay2];
		var temp1 = passCoeff * temp;
		temp1 += temp0;
		passBuffer2[position] = temp1;
		temp1 = temp - passCoeff * temp1;
		
		combBuffer1[position] = temp1 + combCoeff1 * combBuffer1[combDelay1];
		combBuffer2[position] = temp1 + combCoeff2 * combBuffer2[combDelay2];
		
		var out1 = wetMix * combBuffer1[combDelay1];
		var out2 = wetMix * combBuffer2[combDelay2];
		data[i] = out1 + (1.0 - wetMix) * data[i];
		data[i + 1] = out2 + (1.0 - wetMix) * data[i + 1];
		
		position = (position + 1) & bufferSizeBits;
		passDelay1 = (passDelay1 + 1) & bufferSizeBits;
		passDelay2 = (passDelay2 + 1) & bufferSizeBits;
		combDelay1 = (combDelay1 + 1) & bufferSizeBits;
		combDelay2 = (combDelay2 + 1) & bufferSizeBits;
	}
}
