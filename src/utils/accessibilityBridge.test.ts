import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  getAndroidAccessibilityIntentUri,
  ANDROID_ACCESSIBILITY_INTENT_URI,
  executeAccessibilityScroll,
  executeAccessibilityType,
  executeAccessibilityGlobalAction,
  PRESET_ACCESSIBILITY_WORKFLOWS,
  executeAccessibilityWorkflow,
  startContinuousAutoScroll,
  stopContinuousAutoScroll,
  isAutoScrollingActive,
  setAccessibilityPermissionState,
  getAccessibilityPermissionState,
} from './deviceBridge';

describe('Android Accessibility Service & Phone Automation Pure Logic', () => {
  beforeEach(() => {
    stopContinuousAutoScroll();
  });

  it('provides exact Android Accessibility Settings Intent URI', () => {
    const uri = getAndroidAccessibilityIntentUri();
    assert.strictEqual(uri, 'intent:#Intent;action=android.settings.ACCESSIBILITY_SETTINGS;end');
    assert.strictEqual(uri, ANDROID_ACCESSIBILITY_INTENT_URI);
  });

  it('validates scroll directions and clamps distance limits properly', async () => {
    // Distance clamped to min 50px
    const resMin = await executeAccessibilityScroll('down', 10);
    assert.strictEqual(resMin.success, true);
    assert.strictEqual((resMin.details as { distance: number }).distance, 50);

    // Distance clamped to max 2500px
    const resMax = await executeAccessibilityScroll('up', 99999);
    assert.strictEqual(resMax.success, true);
    assert.strictEqual((resMax.details as { distance: number }).distance, 2500);

    // Top and bottom directions
    const resTop = await executeAccessibilityScroll('top');
    assert.strictEqual(resTop.success, true);
    const resBottom = await executeAccessibilityScroll('bottom');
    assert.strictEqual(resBottom.success, true);
  });

  it('rejects empty text for automated typing and accepts valid text', async () => {
    const resEmpty = await executeAccessibilityType('   ');
    assert.strictEqual(resEmpty.success, false);
    assert.match(resEmpty.message, /No text provided/i);

    const resValid = await executeAccessibilityType('Hello Boss, testing automated typing!');
    assert.strictEqual(resValid.success, true);
    assert.strictEqual((resValid.details as { text: string }).text, 'Hello Boss, testing automated typing!');
  });

  it('handles Android global actions: BACK, HOME, RECENTS, NOTIFICATIONS, SCREENSHOT', async () => {
    const actions = ['BACK', 'HOME', 'RECENTS', 'NOTIFICATIONS', 'QUICK_SETTINGS', 'LOCK_SCREEN', 'TAKE_SCREENSHOT'] as const;
    for (const action of actions) {
      const res = await executeAccessibilityGlobalAction(action);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.action, `globalAction:${action}`);
    }
  });

  it('manages continuous auto-scroll lifecycle', () => {
    assert.strictEqual(isAutoScrollingActive(), false);
    startContinuousAutoScroll('slow');
    assert.strictEqual(isAutoScrollingActive(), true);
    stopContinuousAutoScroll();
    assert.strictEqual(isAutoScrollingActive(), false);
  });

  it('provides rich pre-configured accessibility workflows and executes steps', async () => {
    assert.ok(PRESET_ACCESSIBILITY_WORKFLOWS.length >= 3);
    const wf = PRESET_ACCESSIBILITY_WORKFLOWS[0];
    assert.ok(wf.id);
    assert.ok(wf.name);
    assert.ok(wf.steps.length > 0);

    let progressCalls = 0;
    const res = await executeAccessibilityWorkflow(
      {
        id: 'test-wf',
        name: 'Test Workflow',
        description: 'Test description',
        iconName: 'Test',
        steps: [
          { id: '1', action: 'type', payload: 'Testing' },
          { id: '2', action: 'scroll', distance: 100 },
          { id: '3', action: 'wait', duration: 10 },
        ],
      },
      () => {
        progressCalls++;
      }
    );

    assert.strictEqual(res.success, true);
    assert.strictEqual(progressCalls, 3);
  });
});
