import JSS = require("jss");
import React = require("react");
import StyledContext from "./StyledContext";
class Styled extends React.Component<{
    styles: JSS.Styles;
}, {}> {
    public render() {
        return React.createElement(StyledContext.Consumer, {
            children: (params: { id: string }) => {
                const id = params.id;
                const jss = JSS.create({});
                jss.use({
                    onProcessRule: ((rule: any) => {
                        rule.selectorText = ".s__s" + id + " " + rule.key;
                    }) as any,
                });
                const styleSheet = jss.createStyleSheet(this.props.styles);
                return React.createElement("div", { className: "s__s" + id }, [
                    React.createElement("noindex", {
                        key: "style",
                        dangerouslySetInnerHTML: { __html: `<style type="text/css">${styleSheet.toString()}</style>` },
                    }),
                    this.props.children,
                ]);
            },
        });
    }
}
export default Styled;
