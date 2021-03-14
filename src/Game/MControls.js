export const KEY_MAP = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    SHIFT: 16,
    CTRL: 17,
    CMD: 91,
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    I: 73,
    K0: 48,
    K1: 49,
    K2: 50,
    K3: 51,
    K4: 52,
    K5: 53,
    K6: 54,
    K7: 55,
    K8: 56,
    K9: 57,
    SPACE: 32,
    ESC: 27,
};

const listControls = () => {
    console.group('Controls');

    console.groupCollapsed('Edit Modes');

    console.groupCollapsed('Edit: 1');
    console.groupEnd();

    console.groupCollapsed('Add: 2');
    console.log('Invert Switch: I');
    console.groupEnd();

    console.log('Cancel: ESC');
    console.groupEnd();

    console.groupCollapsed('Train');
    console.log('Accelerate: Space');
    console.log('Invert direction: ctrl');
    console.groupEnd();

    console.groupEnd();
};
listControls();
