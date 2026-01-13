enum ChipColor {
    Red = 'red',
    Green = 'green',
    White = 'white'
  }

  enum ChipValue {
    One = 1,
    Five = 5,
    TwentyFive = 25
  }

  const ColorToValue: Record<ChipColor, ChipValue> = {
    [ChipColor.Red]: ChipValue.One,
    [ChipColor.Green]: ChipValue.Five,
    [ChipColor.White]: ChipValue.TwentyFive,
  };
  
  const ValueToColor: Record<ChipValue, ChipColor> = {
    [ChipValue.One]: ChipColor.Red,
    [ChipValue.Five]: ChipColor.Green,
    [ChipValue.TwentyFive]: ChipColor.White,
  };