angular.module('openbrews.recipeUtils', [])
.service('RecipeUtils', function () {

    // calculates IBU given a recipe and
    this.calculateIbu = function (recipe, og) {
        var hops = recipe.hops.filter(function (hop) {
            return hop.aa;
        });

        var gravity = boilGravity(recipe, og);

        return hops.reduce(function (acc, hop) {
            return acc + ibuFromHop(hop, recipe.batchSize, gravity) / hops.length;
        }, 0);
    }

    this.ibuFromHop = function (hop, batchSize, gravity) {
        return 1.65 * Math.pow(0.000125, gravity - 1) * ((1 - Math.pow(Math.E, -0.04 * hop.time)) / 4.15) *
            ((hop.type==="Pellet") ? 1.1 : 1) *
            (((hop.aa / 100) * utils.gramsToOz(hop.grams) * 7490) / utils.litersToGallons(batchSize));
    };

    this.boilGravity = function (recipe, og) {
        return ((recipe.batchSize / recipe.boilSize) * (og - 1) + 1);
    };
});
