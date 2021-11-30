import { Ref, ref, computed } from 'vue';

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Range {
  raw: Ref<string>;
  isValid: Ref<boolean>;
}

const toRangeArray = (value: string) => {
  if (!value) {
    return [];
  }

  return value.split(',').map((v) => {
    const range = v.split('-');

    if (range.length > 2) {
      throw new Error('invalid range');
    }

    return (range.length === 1 ? v : range) as string | [string, string];
  });
};

export const range = ([start, end]: [number, number]) => {
  const result = [];

  for (let i = start; i <= end; i++) {
    result.push(i);
  }

  return result;
};

export class VideoRange implements Range {
  readonly raw = ref('');
  toFrames() {
    const toSeconds = (v: string) => {
      const nums = v.split(':').map(Number);

      if (nums.length === 2) {
        const [minute, second] = nums;
        return minute * 60 + second;
      }

      if (nums.length === 3) {
        const [hour, minute, second] = nums;
        return hour * 3600 + minute * 60 + second;
      }

      throw new Error('invalid time');
    };
    const ranges = toRangeArray(this.raw.value).map((v) =>
      Array.isArray(v) ? (v.map(toSeconds) as [number, number]) : toSeconds(v),
    );

    return ranges.map((v) => (Array.isArray(v) ? range(v) : v)).flat();
  }
  readonly isValid = computed(() => {
    if (!this.raw.value) {
      return true;
    }

    let values: string[];

    try {
      values = toRangeArray(this.raw.value).flat();
    } catch {
      return false;
    }

    const timeReg = /^(\d+:)?(\d{1,2}):\d{1,2}$/;
    return values.every((v) => timeReg.test(v));
  });
}

export class PdfRange {
  readonly raw = ref('');
  toPages() {
    const ranges = toRangeArray(this.raw.value).map((v) =>
      Array.isArray(v) ? (v.map(Number) as [number, number]) : Number(v),
    );

    return ranges.map((v) => (Array.isArray(v) ? range(v) : v)).flat();
  }
  readonly isValid = computed(() => {
    if (!this.raw.value) {
      return true;
    }

    let values: string[];

    try {
      values = toRangeArray(this.raw.value).flat();
    } catch {
      return false;
    }

    const pageReg = /^(\d+-)?\d+$/;
    return values.every((v) => pageReg.test(v));
  });
}

export interface RecognizorParams {
  langs: string[];
  wordSpacePreserved: '0' | '1';
  newlineIgnored: boolean;
  whitelist: string;
  rect?: Rect;
  jobCount?: number;
}

export enum TextInsertionType {
  Append = 'append',
  Replace = 'replace',
  RealReplace = 'realReplace',
}

export interface MonitorConfig extends RecognizorParams {
  isMonitoring: boolean;
  textInsertionType: TextInsertionType;
}
