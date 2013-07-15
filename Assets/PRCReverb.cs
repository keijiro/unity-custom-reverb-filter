using UnityEngine;
using System.Collections;

public class PRCReverb : MonoBehaviour {

	[Range(0.0f, 10.0f)]
	public float decayTime = 4.0f;

	[Range(0.0f, 1.0f)]
	public float wetMix = 0.2f;

	static int bufferSize = 64 * 1024;
	static int bufferSizeBits = bufferSize - 1;
	
	float[] passBuffer1;
	float[] passBuffer2;
	float[] combBuffer1;
	float[] combBuffer2;
	
	int position;
	
	int passDelay1;
	int passDelay2;
	int combDelay1;
	int combDelay2;
	
	float passCoeff = 0.7f;
	float combCoeff1;
	float combCoeff2;
	
	string error;

	void UpdateParameters() {	
		var sampleRate = AudioSettings.outputSampleRate;
		combCoeff1 = Mathf.Pow(10.0f, (-3.0f * combDelay1 / (decayTime * sampleRate)));
		combCoeff2 = Mathf.Pow(10.0f, (-3.0f * combDelay2 / (decayTime * sampleRate)));
	}

	void Awake() {
		passBuffer1 = new float[bufferSize];
		passBuffer2 = new float[bufferSize];
		combBuffer1 = new float[bufferSize];
		combBuffer2 = new float[bufferSize];
		
		// Delay length for 44100 Hz sample rate.
		int[] delays = {341, 613, 1557, 2137};
		
		// Scale the delay lengths if necessary.
		var sampleRate = AudioSettings.outputSampleRate;
		if (sampleRate != 44100) {
			var scaler = sampleRate / 44100.0f;
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

	void Update() {
		if (error == null) {
			UpdateParameters();
		} else {
			Debug.LogError(error);
			Destroy(this);
		}
	}

	void OnAudioFilterRead(float[] data, int channels) {
		if (channels != 2) {
			error = "This filter only supports stereo audio (given:" + channels + ")";
			return;
		}
		
		for (var i = 0; i < data.Length; i += 2) {
			var input = 0.5f * (data[i] + data[i + 1]);
			
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
			data[i] = out1 + (1.0f - wetMix) * data[i];
			data[i + 1] = out2 + (1.0f - wetMix) * data[i + 1];
			
			position = (position + 1) & bufferSizeBits;
			passDelay1 = (passDelay1 + 1) & bufferSizeBits;
			passDelay2 = (passDelay2 + 1) & bufferSizeBits;
			combDelay1 = (combDelay1 + 1) & bufferSizeBits;
			combDelay2 = (combDelay2 + 1) & bufferSizeBits;
		}
	}
}
