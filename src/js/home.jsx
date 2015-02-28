/** @jsx React.DOM */

React.Router.routedElement = document.body;

var Home = React.createClass({
    render: function() {
        return (
            <div>
                {this.props.prop1}
            </div>
        );
    },

    //When the URL hash is '#home', mount this component into the routedElement.
    route: 'home' 
});
