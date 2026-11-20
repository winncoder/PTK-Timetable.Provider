# Phone model used by the PTK website

`ptk-phone.glb` is an optimized copy of Innerscene's [Open foldable phone](https://www.innerscene.com/tools/library/3d-parts/open-foldable-phone-c6ae60e7). The source page identifies the model as **CC0 1.0 / public domain** and permits use, modification, and redistribution, including commercial use, without attribution. See the [CC0 deed](https://creativecommons.org/publicdomain/zero/1.0/).

The original GLB is available from the source page's download link. Its mesh geometry is retained; embedded textures were resized to a maximum of 512 pixels with `scripts/optimize-phone-model.py`, reducing the file from 13,284,584 to 691,788 bytes. The page's PTK timetable screen is drawn by Three.js at runtime and is an illustration, not a screenshot of the app.

The optimizer requires Python 3 and Pillow. For example:

```sh
python3 scripts/optimize-phone-model.py /path/to/original.glb public/models/ptk-phone.glb
```
