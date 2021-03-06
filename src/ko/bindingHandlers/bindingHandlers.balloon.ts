﻿import * as ko from "knockout";
import { Keys } from "@paperbits/common/keyboard";
import { IComponent, ITemplate, View } from "@paperbits/common/ui";
import { ViewStack } from "../ui/viewStack";

export interface BalloonOptions {
    position: string;
    selector?: string;
    component?: IComponent;
    template?: ITemplate;
    onCreated?: (handle) => void;
    isOpen: any;
    onOpen?: () => void;
    onClose?: () => void;
    closeOn: ko.Subscribable;
    closeTimeout?: number;
    displayOnEnter?: boolean;
    offsetOnEnter?: number;
}

export class BalloonBindingHandler {
    constructor(viewStack: ViewStack) {
        ko.bindingHandlers["balloon"] = {
            init: (toggleElement: HTMLElement, valueAccessor: () => BalloonOptions) => {

                const options = ko.unwrap(valueAccessor());

                let inBalloon = false
                let isHoverOver = false;

                let view: View;
                let balloonElement: HTMLElement;
                let balloonTipElement: HTMLElement;
                let balloonIsOpen = false;
                let closeTimeout;

                let createBalloonElement: () => void;

                if (options.component) {
                    createBalloonElement = () => {
                        balloonElement = document.createElement("div");
                        balloonElement.classList.add("balloon");
                        ko.applyBindingsToNode(balloonElement, { component: options.component }, null);
                        document.body.appendChild(balloonElement);
                    };
                }

                if (options.template) {
                    createBalloonElement = () => {
                        balloonElement = document.createElement("div");
                        balloonElement.classList.add("balloon");
                        ko.applyBindingsToNode(balloonElement, { template: options.template }, null);
                        document.body.appendChild(balloonElement);
                    };
                }

                const createBalloonTip = () => {
                    balloonTipElement = document.createElement("div");
                    balloonTipElement.classList.add("balloon-tip");
                    document.body.appendChild(balloonTipElement);
                };

                const removeBalloon = () => {
                    if (!balloonElement) {
                        return;
                    }

                    ko.cleanNode(balloonElement);
                    balloonElement.remove();
                    balloonElement = null;

                    balloonTipElement.remove();
                    balloonTipElement = null;

                    viewStack.removeView(view);
                };

                const resetCloseTimeout = () => {
                    if (options.closeTimeout) {
                        clearTimeout(closeTimeout);
                        closeTimeout = setTimeout(close, options.closeTimeout);
                    }
                };

                const updatePosition = async (): Promise<void> => {
                    if (!balloonElement || !balloonElement) {
                        return;
                    }

                    const preferredPosition = options.position;
                    const preferredDirection = preferredPosition === "left" || preferredPosition === "right"
                        ? "horizontal"
                        : "vertical";

                    const triggerRect = toggleElement.getBoundingClientRect();
                    const balloonRect = balloonElement.getBoundingClientRect();
                    const spaceTop = triggerRect.top;
                    const spaceBottom = window.innerHeight - triggerRect.bottom;
                    const spaceLeft = triggerRect.left;
                    const spaceRight = window.innerWidth - triggerRect.height;

                    const balloonTipSize = 10;
                    const egdeGap = 10;

                    let balloonLeft;
                    let balloonRight;
                    let balloonTop;
                    let balloonBottom;
                    let selectedPosition;

                    let positionX: string;
                    let positionY: string;
                    let availableSpaceX: number;
                    let availableSpaceY: number;
                    let balloonHeight: number = balloonRect.height;
                    let balloonWidth: number = balloonRect.width;

                    let balloonTipX;
                    let balloonTipY;

                    if (preferredDirection === "vertical") {
                        if (spaceTop > spaceBottom) {
                            positionY = "top";
                            availableSpaceY = spaceTop - egdeGap;
                        }
                        else {
                            positionY = "bottom";
                            availableSpaceY = spaceBottom - egdeGap;

                        }
                    }
                    else {
                        if (spaceLeft > spaceRight) {
                            positionX = "left";
                            availableSpaceX = spaceLeft - egdeGap;

                        }
                        else {
                            positionX = "right";
                            availableSpaceX = spaceRight - egdeGap;

                        }
                    }

                    if (balloonRect.height > availableSpaceY) {
                        balloonHeight = availableSpaceY;
                    }

                    if (balloonRect.width > availableSpaceX) {
                        balloonWidth = availableSpaceX;
                    }

                    switch (positionY) {
                        case "top":
                            balloonTop = triggerRect.top;

                            if ((balloonTop - balloonHeight) < 0) {
                                positionY = "bottom";
                            }
                            break;

                        case "bottom":
                            balloonTop = triggerRect.top + triggerRect.height;

                            if (balloonTop + balloonHeight > window.innerHeight) {
                                positionY = "top";
                            }
                            break;
                    }

                    switch (positionX) {
                        case "left":
                            balloonLeft = triggerRect.left;

                            if ((balloonLeft - balloonWidth) < 0) {
                                positionX = "right";
                            }
                            break;

                        case "right":
                            balloonLeft = triggerRect.left + triggerRect.width;

                            if (balloonLeft + balloonWidth > window.innerWidth) {
                                positionX = "left";
                            }
                            break;
                    }

                    balloonTipElement.classList.remove("balloon-top");
                    balloonTipElement.classList.remove("balloon-bottom");
                    balloonTipElement.classList.remove("balloon-left");
                    balloonTipElement.classList.remove("balloon-right");

                    if (preferredDirection === "vertical") {
                        switch (positionY) {
                            case "top":
                                balloonTop = triggerRect.top - balloonHeight - 5;
                                balloonLeft = triggerRect.left + (triggerRect.width / 2) - (balloonWidth / 2);
                                balloonTipX = triggerRect.left + Math.floor(triggerRect.width / 2) - (balloonTipSize / 2);
                                balloonTipY = triggerRect.top - balloonTipSize;
                                balloonTipElement.classList.add("balloon-top");
                                selectedPosition = "top";
                                break;

                            case "bottom":
                                balloonTop = triggerRect.top + triggerRect.height + 5;
                                balloonLeft = triggerRect.left + (triggerRect.width / 2) - (balloonWidth / 2);
                                balloonTipX = triggerRect.left + Math.floor(triggerRect.width / 2) - (balloonTipSize / 2);
                                balloonTipY = triggerRect.bottom;
                                balloonTipElement.classList.add("balloon-bottom");
                                selectedPosition = "bottom";
                                break;
                        }
                    }
                    else {
                        switch (positionX) {
                            case "left":
                                balloonTop = triggerRect.top + (triggerRect.height / 2) - (balloonHeight / 2);
                                balloonLeft = triggerRect.left - balloonWidth - balloonTipSize;
                                balloonTipX = triggerRect.left - balloonTipSize - (balloonTipSize / 2);
                                balloonTipY = triggerRect.top + Math.floor(triggerRect.height / 2) - (balloonTipSize / 2);
                                balloonTipElement.classList.add("balloon-left");
                                selectedPosition = "left";
                                break;

                            case "right":
                                balloonTop = triggerRect.top + (triggerRect.height / 2) - (balloonHeight / 2);
                                balloonLeft = triggerRect.right + balloonTipSize;
                                balloonTipX = triggerRect.right + (balloonTipSize / 2);
                                balloonTipY = triggerRect.top + Math.floor(triggerRect.height / 2) - (balloonTipSize / 2);
                                balloonTipElement.classList.add("balloon-right");
                                selectedPosition = "right";
                                break;
                        }
                    }

                    if (balloonTop < egdeGap) {
                        balloonTop = egdeGap;
                    }

                    if (balloonTop + balloonHeight > innerHeight - egdeGap) {
                        balloonBottom = egdeGap;
                    }
                    else {
                        balloonBottom = innerHeight - (balloonTop + balloonHeight);
                    }

                    if (balloonLeft < egdeGap) {
                        balloonLeft = egdeGap;
                    }

                    delete balloonElement.style.top;
                    delete balloonElement.style.bottom;
                    delete balloonElement.style.left;
                    delete balloonElement.style.right;

                    switch (selectedPosition) {
                        case "top":
                            balloonElement.style.bottom = `${balloonBottom}px`;
                            balloonElement.style.left = `${balloonLeft}px`;
                            break;

                        case "bottom":
                            balloonElement.style.top = `${balloonTop}px`;
                            balloonElement.style.left = `${balloonLeft}px`;
                            break;

                        case "left":
                            balloonElement.style.top = `${balloonTop}px`;
                            balloonElement.style.height = `${balloonHeight}px`;
                            // balloonElement.style.right = `${balloonRight}px`; // TODO: Make it work
                            balloonElement.style.left = `${balloonLeft}px`;
                            break;

                        case "right":
                            balloonElement.style.top = `${balloonTop}px`;
                            balloonElement.style.height = `${balloonHeight}px`;
                            balloonElement.style.left = `${balloonLeft}px`;
                            break;
                    }

                    balloonElement.style.maxHeight = availableSpaceY + "px";
                    balloonElement.style.maxWidth = availableSpaceX + "px";

                    balloonTipElement.style.top = `${balloonTipY}px`;
                    balloonTipElement.style.left = `${balloonTipX}px`;
                };

                const open = (returnFocusTo: HTMLElement): void => {
                    resetCloseTimeout();

                    if (balloonIsOpen) {
                        return;
                    }

                    view = {
                        close: close,
                        element: balloonElement,
                        returnFocusTo: returnFocusTo,
                        hitTest: (targetElement) => {
                            const element =
                                closest(targetElement, x => x === balloonElement) ||
                                closest(targetElement, x => x === toggleElement);

                            return !!element;
                        }
                    };

                    setImmediate(() => { // give chance to view stack to clear unrelated views
                        createBalloonElement();
                        createBalloonTip();
                        viewStack.pushView(view);

                        balloonElement.classList.add("balloon-is-active");
                        requestAnimationFrame(updatePosition);

                        balloonIsOpen = true;

                        if (options.onOpen) {
                            options.onOpen();
                        }

                        if (options.displayOnEnter) {
                            balloonElement.addEventListener("mouseenter", () => {
                                inBalloon = true;
                            });

                            balloonElement.addEventListener("mouseleave", () => {
                                inBalloon = false;
                                checkCloseHoverBalloon();
                            });
                        }
                    });
                };

                const close = (): void => {
                    if (!balloonElement) {
                        return;
                    }

                    balloonIsOpen = false;

                    if (options.onClose) {
                        options.onClose();
                    }

                    removeBalloon();

                    if (options.isOpen && options.isOpen()) {
                        // TODO: ViewManager should have stack of open editors, so they need to be closed one by one.
                        options.isOpen(false);
                    }
                };

                const toggle = (): void => {
                    resetCloseTimeout();

                    if (balloonIsOpen) {
                        if (!options.closeTimeout) {
                            close();
                        }
                    }
                    else {
                        open(toggleElement);
                    }
                };

                const ballonHandle = {
                    open: open,
                    close: close,
                    toggle: toggle
                };

                if (options.onCreated) {
                    options.onCreated(ballonHandle);
                }

                const closest = (node: Node, predicate: (node: Node) => boolean): Node => {
                    do {
                        if (predicate(node)) {
                            return node;
                        }

                        node = node.parentNode;
                    }
                    while (node);
                };

                const onPointerDown = async (event: MouseEvent): Promise<void> => {
                    if (!toggleElement) {
                        return;
                    }

                    const targetElement = <HTMLElement>event.target;
                    const element = closest(targetElement, (node) => node === toggleElement);

                    if (element) {
                        toggle();
                    }
                };

                const onMouseEnter = async (event: MouseEvent): Promise<void> => {
                    isHoverOver = true;

                    setTimeout(() => {
                        if (!isHoverOver) {
                            return;
                        }

                        open(toggleElement);
                    }, options.offsetOnEnter || 0);
                };

                const onMouseLeave = async (event: MouseEvent): Promise<void> => {
                    isHoverOver = false;
                    checkCloseHoverBalloon();
                };

                const checkCloseHoverBalloon = async (): Promise<void> => {
                    setTimeout(() => {
                        if (!isHoverOver && !inBalloon) {
                            close();
                        }
                    }, 50);
                };

                const onKeyDown = async (event: KeyboardEvent): Promise<void> => {
                    switch (event.keyCode) {
                        case Keys.Enter:
                        case Keys.Space:
                            event.preventDefault();
                            toggle();
                            break;
                    }
                };

                const onClick = (event: MouseEvent): void => {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                };

                const onScroll = async (event: MouseEvent): Promise<void> => {
                    if (!balloonElement) {
                        return;
                    }

                    requestAnimationFrame(updatePosition);
                };

                if (options.closeOn) {
                    options.closeOn.subscribe(() => close());
                }

                toggleElement.addEventListener("keydown", onKeyDown);
                toggleElement.addEventListener("click", onClick);

                if (options.displayOnEnter) {
                    toggleElement.addEventListener("mouseenter", onMouseEnter);
                    toggleElement.addEventListener("mouseleave", onMouseLeave);
                }

                window.addEventListener("scroll", onScroll, true);

                document.addEventListener("mousedown", onPointerDown, true);

                ko.utils.domNodeDisposal.addDisposeCallback(toggleElement, () => {
                    toggleElement.removeEventListener("keydown", onKeyDown);
                    toggleElement.removeEventListener("click", onClick);

                    if (options.displayOnEnter) {
                        toggleElement.removeEventListener("mouseenter", onMouseEnter);
                        toggleElement.removeEventListener("mouseleave", onMouseLeave);
                    }

                    removeBalloon();
                    window.removeEventListener("scroll", onScroll, true);
                    window.removeEventListener("mousedown", onPointerDown, true);
                });
            }
        };
    }
}