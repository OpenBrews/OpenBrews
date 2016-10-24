angular.module('openbrews.recipeUtils', [])
.service('RecipeUtils', function () {

    // calculates IBU given a recipe and OG (original gravity).
    this.calculateIbu = function (recipe, og) {
        var hops = recipe.hops.filter(function (hop) {
            return hop.aa;
        });

        var gravity = this.boilGravity(recipe, og);

        return hops.reduce(function (acc, hop) {
            return acc + this.ibuFromHop(hop, recipe.batchSize, gravity) / hops.length;
        }, 0);
    }

    this.ibuFromHop = function (hop, batchSize, gravity) {
        return 1.65 * Math.pow(0.000125, gravity - 1) * ((1 - Math.pow(Math.E, -0.04 * hop.time)) / 4.15) *
        ((hop.type==="Pellet") ? 1.1 : 1) *
        (((hop.aa / 100) * this.gramsToOz(hop.grams) * 7490) / this.litersToGallons(batchSize));
    };

    this.boilGravity = function (recipe, og) {
        var boilSize = (recipe.boilSizeUnits === 'L')? this.litersToGallons(recipe.boilSize) : recipe.boilSize;

        return ((this.calcBatchSize(recipe) / boilSize) * (og - 1) + 1);
    };

    this.gramsToOz = function (grams) {
        return grams * 0.0352739619;
    };

    this.litersToGallons = function (liters) {
        return liters * 0.26417;
    };

    this.kgsToLbs = function (kgs) {
        return kgs * 2.2046;
    };

    this.mlToFlOz = function (ml) {
        return ml * 0.033814;
    }

    // Calculate the total batch size of the recipe.
    this.calcBatchSize = function (recipe) {
        var sum = 0;

        sum += recipe.fermentables.reduce(function (acc, frmtable) {
            return acc + (frmtable.weightUnits === 'Kg')? this.kgsToLbs(frmtable.weight) : frmtable.weight;
        });

        sum += recipe.hops.reduce(function (acc, hop) {
            return acc + (hop.weightUnits === 'G')? this.gramsToOz(hop.weight) : hop.weight;
        });

        sum += recipe.items.reduce(function (acc, yeast) {
            switch (yeast.amountUnits) {
                case 'G': acc += this.gramsToOz(yeast.amount);
                break;

                case 'ml': acc += this.mlToFlOz(yeast.amount);
                break;

                default: acc += yeast.amount;
                break;
            }

            return acc;
        });

        sum += recipe.others.reduce(function (acc, item) {
            switch (item.amountUnits) {
                case 'G': acc += this.gramsToOz(item.amount);
                break;

                case 'ml': acc += this.mlToFlOz(item.amount);
                break;

                default: acc += item.amount;
                break;
            }

            return acc;
        });

        return sum;
    };

    this.calculateGravity = function (recipe) {
        var og, fg;
        var attenuation = recipe.yeasts.reduce(function (acc, yeast) {
            return acc + yeast.attenuation;
        }) / recipe.yeasts.length;

        var p = this.pointsPerGallon(recipe.fermentables, this.calcBatchSize(recipe), recipe.mashEfficiency);

        og = p / 1000 + 1;

        // FG
        if (!attenuation) {
            attenuation = 75;
        }

        fg = 1 + ((100 - attenuation) / 100) * (og - 1);

        return {
            og: og,
            fg: fg
        };
    };

    this.calculateAbv = function (grav) {
        return Math.round((1000 * (grav.og - grav.fg) * (125 * 1.05)) / 1000);
    };

    this.pointsPerGallon = function (fermentables, batchSize, efficiency) {

        return fermentables.reduce(function (acc, frmtable) {
            var weight = (frmtable.weightUnits === 'Kg')? this.kgsToLbs(frmtable.weight) : frmtable.weight;

            if (frmtable.method.match('Mash')) { // Efficiency counts only for mashable fermentables
                acc += ((frmtable.ppg - 1) * 1000 * weight * (efficiency / 100)) / batchSize;
            } else {
                acc += ((frmtable.ppg - 1) * 1000 * weight) / batchSize;
            }
            return acc;
        }, 0);
    };

});
