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
    };

    // Calculates the IBU value of a hop.
    // Values derived from http://howtobrew.com/book/section-1/hops/hop-bittering-calculations
    this.ibuFromHop = function (hop, batchSize, gravity) {
        return 1.65 * Math.pow(0.000125, gravity - 1) * ((1 - Math.pow(Math.E, -0.04 * hop.time)) / 4.15) *
        ((hop.type==='Pellet') ? 1.1 : 1) *
        (((hop.aa / 100) * this.gramToOz(hop.grams) * 7490) / this.literToGallon(batchSize));
    };

    // Calculates the boil gravity (the gravity lost during boiling..?) of a recipe.
    this.boilGravity = function (recipe, og) {
        var boilSize = (recipe.boilSizeUnits === 'L')? this.literToGallon(recipe.boilSize) : recipe.boilSize;

        return ((this.calcBatchSize(recipe) / boilSize) * (og - 1) + 1);
    };

    // Converts grams to ounces.
    this.gramToOz = function (grams) {
        return grams * 0.0352739619;
    };

    // Converts liters to gallons.
    this.literToGallon = function (liters) {
        return liters * 0.26417;
    };


    // Converts kilograms to pounds.
    this.kgToLb = function (kgs) {
        return kgs * 2.2046;
    };

    // Converts milliliters to fluid ounces.
    this.mlToFlOz = function (ml) {
        return ml * 0.033814;
    };

    // Converts ounces to pounds.
    this.ozToLb = function (oz) {
        return oz * 0.0625;
    };

    // Calculate the total batch size of the recipe.
    this.calcBatchSize = function (recipe) {
        var sum = 0;

        sum += recipe.fermentables.reduce(function (acc, frmtable) {
            return acc + (frmtable.weightUnits === 'Kg')? this.kgToLb(frmtable.weight) : frmtable.weight;
        });

        sum += this.ozToLb(recipe.hops.reduce(function (acc, hop) {
            return acc + (hop.weightUnits === 'G')? this.gramToOz(hop.weight) : hop.weight;
        }));

        sum += this.ozToLb(recipe.items.reduce(function (acc, yeast) {
            switch (yeast.amountUnits) {
                case 'G': acc += this.gramToOz(yeast.amount);
                break;

                case 'ml': acc += this.mlToFlOz(yeast.amount);
                break;

                default: acc += yeast.amount;
                break;
            }

            return acc;
        }));

        sum += this.ozToLb(recipe.others.reduce(function (acc, item) {
            switch (item.amountUnits) {
                case 'G': acc += this.gramToOz(item.amount);
                break;

                case 'ml': acc += this.mlToFlOz(item.amount);
                break;

                default: acc += item.amount;
                break;
            }

            return acc;
        }));

        return sum;
    };

    this.calculateGravity = function (recipe) {
        // original gravity, final gravity to be calculated.
        // gravity is the "density" of the liquid; gravity of
        // water is 1.0. So gravity of beer will be a little
        // higher than this, and the original gravity (when
        // more sugars are present) will be higher than the
        // final gravity.
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

        // calculate final gravity given the attenuation of the yeast.
        // Attenuation = % of sugars that the yeast 'consume'.
        // Attenuation = [(og-fg)/(og-1)] x 100
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
            var weight = (frmtable.weightUnits === 'Kg')? this.kgToLb(frmtable.weight) : frmtable.weight;

            if (frmtable.method.match('Mash')) { // Efficiency counts only for mashable fermentables
                acc += ((frmtable.ppg - 1) * 1000 * weight * (efficiency / 100)) / batchSize;
            } else {
                acc += ((frmtable.ppg - 1) * 1000 * weight) / batchSize;
            }
            return acc;
        }, 0);
    };

});
