import DS from 'ember-data';

export default DS.Model.extend({
    title:DS.attr("string"),
    year:DS.attr("string"),
    filepath:DS.attr("string"),
    posterpath:DS.attr("string"),
    backdrop_path:DS.attr("string"),
    overview:DS.attr("string"),
    vote_average:DS.attr("number")
});