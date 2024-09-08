import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { VisualNode } from "@flyde/core";
import { useVisualNodeEditorContext } from "./VisualNodeEditorContext";
import { GroupEditorBoardData } from "./VisualNodeEditor";
import { usePorts } from "../flow-editor/ports";
import { Icon } from "@blueprintjs/core";
import { Lightbulb, SmallTick } from "@blueprintjs/icons";
import { useLocalStorage } from "../lib/user-preferences";
import { useDarkMode } from "../flow-editor/DarkModeContext";

interface TipData {
  tip: string;
  predicate: (
    lastAndCurrNode: [VisualNode, VisualNode],
    lastAndCurrBoardData: [GroupEditorBoardData, GroupEditorBoardData]
  ) => boolean;
}

const tips: Record<string, TipData> = {
  pan: {
    tip: "Try panning the canvas by holding the space bar and dragging",
    predicate: (_, [lastBoardData, currBoardData]) => {
      const dx = lastBoardData.viewPort.pos.x - currBoardData.viewPort.pos.x;
      const dy = lastBoardData.viewPort.pos.y - currBoardData.viewPort.pos.y;

      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance > 75;
    },
  },
  zoom: {
    tip: "Zoom in and out using Ctrl/Cmd + mouse wheel",
    predicate: (_, [lastBoardData, currBoardData]) => {
      const dz = lastBoardData.viewPort.zoom - currBoardData.viewPort.zoom;
      return Math.abs(dz) > 0.25;
    },
  },
  addNode: {
    tip: "Add a new node by clicking or dragging from the library",
    predicate: ([lastNode, currNode]) => {
      return currNode.instances.length > lastNode.instances.length;
    },
  },
  connect: {
    tip: "Connect two nodes by dragging from an output pin to an input pin",
    predicate: ([lastNode, currNode]) => {
      return currNode.connections.length > lastNode.connections.length;
    },
  },
};

export type TipAction = keyof typeof tips;

const tipsOrder: TipAction[] = ["pan", "zoom", "addNode", "connect"];

interface OnboardingTipsProps {}

const TIPS_ADVANCE_TIMEOUT = 1000;
const TIP_COMPLETED_FEEDBACK_TIMEOUT = 3000;
const ALL_TIPS_COMPLETED_FEEDBACK_TIMEOUT = 10000;

export const OnboardingTips: React.FC<OnboardingTipsProps> = () => {
  const { node, boardData } = useVisualNodeEditorContext();

  const { reportEvent } = usePorts();

  const [currentTip, setCurrentTip] = useLocalStorage(
    "onboarding-tip",
    tipsOrder[0]
  );
  const [showFeedback, setShowFeedback] = useState(false);

  const [isCompleted, setIsCompleted] = useLocalStorage(
    "onboarding-tip-completed",
    false
  );

  const lastBoardData = useRef<GroupEditorBoardData>();
  const lastNode = useRef<VisualNode>();

  const [showTips, setShowTips] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const isDark = useDarkMode();

  useEffect(() => {
    setTimeout(() => setShowTips(true), 1000);
  }, []);

  useEffect(() => {
    if (!showTips || lastBoardData.current) {
      return;
    }
    lastBoardData.current = boardData;
    lastNode.current = node;
  }, [showTips, boardData, node]);

  const currIndex = useMemo(() => {
    return tipsOrder.indexOf(currentTip);
  }, [currentTip]);

  const advanceTip = useCallback(() => {
    setShowFeedback(true);
    const nextTip = tipsOrder[currIndex + 1];
    const isLast = currIndex === tipsOrder.length - 1;

    reportEvent("onBoardingTipCompleted", {
      tip: currentTip,
    });

    setTimeout(
      () => {
        setShowFeedback(false);
        setIsAdvancing(false);
        if (isLast) {
          setIsCompleted(true);
        } else {
          setCurrentTip(nextTip);
        }
      },
      isLast
        ? ALL_TIPS_COMPLETED_FEEDBACK_TIMEOUT
        : TIP_COMPLETED_FEEDBACK_TIMEOUT
    );
  }, [currIndex, reportEvent, currentTip, setIsCompleted, setCurrentTip]);

  useEffect(() => {
    if (isCompleted) {
      return;
    }

    if (!lastBoardData.current || !lastNode.current) {
      return;
    }

    if (isAdvancing) {
      return;
    }

    if (
      tips[currentTip].predicate(
        [lastNode.current, node],
        [lastBoardData.current, boardData]
      )
    ) {
      lastNode.current = node;
      lastBoardData.current = boardData;
      setIsAdvancing(true);
      setTimeout(() => {
        advanceTip();
      }, TIPS_ADVANCE_TIMEOUT);
    }
  }, [currentTip, advanceTip, isCompleted, node, boardData, isAdvancing]);

  return isCompleted ? null : (
    <div className={`onboarding-tips ${isDark ? "dark" : ""}`}>
      {showFeedback ? (
        <div className="onboarding-tip-feedback">
          <Icon icon={<SmallTick />} />
          {currIndex === tipsOrder.length - 1
            ? "Great job! For more tips, check out the help menu."
            : "Great job! Moving to the next tip..."}
        </div>
      ) : (
        <div className="onboarding-tip-text">
          <Icon icon={<Lightbulb size={12} />} />
          {tips[currentTip].tip}
        </div>
      )}
    </div>
  );
};
