# PixelShuffler layer for Keras (TF2-compatible)
# Original by t-ae; adapted for ElloFive / modern Keras

import tensorflow as tf
from tensorflow.keras.layers import Layer


class PixelShuffler(Layer):
    def __init__(self, size=(2, 2), data_format=None, **kwargs):
        super().__init__(**kwargs)
        if isinstance(size, int):
            size = (size, size)
        self.size = tuple(size)
        self.data_format = data_format or "channels_last"

    def call(self, inputs):
        rh, rw = self.size
        return tf.nn.depth_to_space(inputs, rh, data_format="NHWC")

    def compute_output_shape(self, input_shape):
        if len(input_shape) != 4:
            raise ValueError("Inputs should have rank 4; got: %s" % (input_shape,))
        batch_size, h, w, c = input_shape
        rh, rw = self.size
        return (batch_size, h * rh if h else None, w * rw if w else None, c // (rh * rw) if c else None)

    def get_config(self):
        config = super().get_config()
        config.update({"size": self.size, "data_format": self.data_format})
        return config
