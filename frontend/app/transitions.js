
export default function(){
    console.log("HIIER!");
        this.transition(
        this.toRoute('settings'),
        this.toRoute('library'),
        this.toRoute('index'),
        this.use('crossFade', {duration:500})
    );
    this.transition(
        this.fromRoute("library"),
        this.fromRoute("library.list"),
        this.toRoute("item"),
        this.use("explode",
            {
                "matchBy":"data-poster-image",
                "use":["fly-to", {duration:700}]
            },
            {
                "use":["toUp", {duration:500, "movingSide":"new"}]
            })
    );
}