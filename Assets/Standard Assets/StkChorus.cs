// STK chorus effect class, based on CCRMA STK library.
// https://ccrma.stanford.edu/software/stk/
using UnityEngine;
using System.Collections;

public class StkChorus : MonoBehaviour
{
    // Base delay time.
    [Range(0.0f, 10000.0f)]
    public float
        decayTime = 6000.0f;

    // Modulation depth.
    [Range(0.0f, 1.0f)]
    public float
        depth = 0.5f;

    // Modulation frequency.
    [Range(0.0f, 10.0f)]
    public float
        freq = 0.5f;

    // Wet signal ratio.
    [Range(0.0f, 1.0f)]
    public float
        wetMix = 0.1f;

    // Delay lines.
    DelayLine delay1;
    DelayLine delay2;

    // Used for error handling.
    string error;

    void UpdateParameters ()
    {
    }

    void Awake ()
    {
        UpdateParameters ();
    }

    void Update ()
    {
        if (error == null) {
            UpdateParameters ();
        } else {
            Debug.LogError (error);
            Destroy (this);
        }
    }

    void OnAudioFilterRead (float[] data, int channels)
    {
        if (channels != 2) {
            error = "This filter only supports stereo audio (given:" + channels + ")";
            return;
        }
        
        for (var i = 0; i < data.Length; i += 2) {
            var input = 0.5f * (data [i] + data [i + 1]);

            var out1 = input;
            var out2 = input;

            data [i] = out1;
            data [i + 1] = out2;
        }
    }
}
