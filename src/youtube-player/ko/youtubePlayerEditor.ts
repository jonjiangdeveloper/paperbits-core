import * as ko from "knockout";
import * as Objects from "@paperbits/common/objects";
import template from "./youtubePlayerEditor.html";
import { Component, OnMounted, Param, Event } from "@paperbits/common/ko/decorators";
import { YoutubePlayerModel } from "../youtubePlayerModel";
import { ChangeRateLimit } from "@paperbits/common/ko/consts";
import { WidgetEditor } from "@paperbits/common/widgets";
import { SizeStylePluginConfig } from "@paperbits/styles/contracts";
import { ViewManager } from "@paperbits/common/ui";
import { EventManager, CommonEvents } from "@paperbits/common/events";

@Component({
    selector: "youtube-player-editor",
    template: template
})
export class YoutubePlayerEditor implements WidgetEditor<YoutubePlayerModel> {
    public readonly videoId: ko.Observable<string>;
    public readonly controls: ko.Observable<boolean>;
    public readonly autoplay: ko.Observable<boolean>;
    public readonly loop: ko.Observable<boolean>;
    public readonly sizeConfig: ko.Observable<SizeStylePluginConfig>;

    constructor(
        private readonly viewManager: ViewManager,
        private readonly eventManager: EventManager
    ) {
        this.videoId = ko.observable<string>();
        this.controls = ko.observable<boolean>();
        this.autoplay = ko.observable<boolean>();
        this.loop = ko.observable<boolean>();
        this.sizeConfig = ko.observable();
    }

    @Param()
    public model: YoutubePlayerModel;

    @Event()
    public onChange: (model: YoutubePlayerModel) => void;

    @OnMounted()
    public initialize(): void {
        this.eventManager.addEventListener(CommonEvents.onViewportChange, this.updateObservables);

        this.videoId
            .extend(ChangeRateLimit)
            .subscribe(this.applyChanges);

        this.controls
            .extend(ChangeRateLimit)
            .subscribe(this.applyChanges);

        this.autoplay
            .extend(ChangeRateLimit)
            .subscribe(this.applyChanges);

        this.loop
            .extend(ChangeRateLimit)
            .subscribe(this.applyChanges);
    }

    private updateObservables(): void {
        const viewport = this.viewManager.getViewport();
        const containerSizeStyles = this.model?.styles?.instance?.[viewport]?.size || this.model?.styles?.instance?.size;
        this.sizeConfig(containerSizeStyles);

        this.videoId(this.model.videoId);
        this.controls(this.model.controls);
        this.autoplay(this.model.autoplay);
        this.loop(this.model.loop);
    }

    public onSizeChange(pluginConfig: SizeStylePluginConfig): void {
        const viewport = this.viewManager.getViewport();
        Objects.setValue(`styles/instance/size/${viewport}`, this.model, pluginConfig);
        this.applyChanges();
    }

    private applyChanges(): void {
        this.model.videoId = this.videoId();
        this.model.controls = this.controls();
        this.model.autoplay = this.autoplay();
        this.model.loop = this.loop();

        this.onChange(this.model);
    }
}
