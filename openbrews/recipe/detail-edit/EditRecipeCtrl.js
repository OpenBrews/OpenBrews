/*global
  angular
*/
//AddRecipe shows a list of recipes saved to the users device or profile
(function(){
  'use strict';
  angular.module('openbrews.editRecipe', [
    'openbrews.fermentableDirective',
    'openbrews.hopDirective',
    'openbrews.yeastDirective',
    'openbrews.otherIngredientDirective',
    'openbrews.noteDirective',
    'openbrews.recipeStore',
    'openbrews.recipeUtils'
  ])
    .controller('EditRecipeCtrl', ['$scope', '$state', 'RecipeStore', 'RecipeUtils', function($scope, $state, RecipeStore, RecipeUtils) {

      const defaultRecipe = {
        name: "",
        style: "",
        boilSize: 0,
        boilSizeUnits: "Gal",
        boilTime: 60,
        estFermentationDays: 7,
        secondaryTimeDays: 0,
        mashEfficiency: 68,
        ibu: 0,
        fermentables: [],
        hops: [],
        yeasts: [],
        others: [],
        notes: []
      };

      $scope.calcIBU = function() {
          var og = RecipeUtils.calculateGravity($scope.recipe).og;
          return RecipeUtils.calculateIbu($scope.recipe, og);
      };

      /* Add a new fermentable */
      $scope.addFermentable = function() {
        $scope.recipe.fermentables.push(
          {
            method: "Mash",
            weight: 0,
            weightUnits: "Lbs",
            addTime: 0,
            ppg: 0,
            srm: 0
          }
        );
      };

      /* remove the fermentable at the given index */
      $scope.deleteFermentable = function(index) {
        $scope.recipe.fermentables.splice(index,1);
      };

      /* Add other ingredient. */
      $scope.addOther = function() {
        $scope.recipe.others.push({
          name: "",
          amount: 0,
          amountUnits: "oz",
          stage: "Boil",
          addTime: 0
        });
      };

      /* Delete other ingredient. */
      $scope.deleteOther = function(index) {
        $scope.recipe.others.splice(index,1);
      };

      /* Add a new Hop */
      $scope.addHop = function() {
        $scope.recipe.hops.push(
          {
            weight: 0,
            weightUnits: "oz",
            type: "Pellet",
            aa: 0,
            stage: "Boil",
            addTime: 0
          }
        );
      };

      /* remove the Hop at the given index */
      $scope.deleteHop = function(index) {
        $scope.recipe.hops.splice(index,1);
      };

      /* Delete the yeast at supplied index */
      $scope.deleteYeast = function(index) {
        $scope.recipe.yeasts.splice(index, 1);
      };

      /* Add a new yeast */
      $scope.addYeast = function() {
        $scope.recipe.yeasts.push(
          {
            amount: 0,
            attenuation: 0,
            flocculation: "Medium-Low",
            amountUnits: "G"
          }
        );
      };

      /* Add a new note */
      $scope.addNote = function() {
        $scope.recipe.notes.push({
          "text": ""
        });
      }

      /* Delete the given note */
      $scope.deleteNote = function(index) {
        $scope.recipe.notes.splice(index, 1);
      }

      /* Save a recipe in LocalStorage */
      $scope.saveRecipe = function() {
        if ($state.params.isNew) {
          RecipeStore.insert($scope.recipe);
        } else {
          RecipeStore.update($scope.recipe);
        }
        $state.go("recipes");
      };

      // Initializer
      (function () {
        // Differentiate between add or edit
        if ($state.params.recipeId) {
            const recipe = RecipeStore.get($state.params.recipeId);
            if (recipe) {
              $scope.recipe = recipe;
              $scope.pageTitle = 'Edit Recipe';
            } else {
              // This Recipe doesn't exist
              $state.go("recipes");
            }
        } else {
          if ($state.params.isNew) {
            $scope.recipe = defaultRecipe;
            $scope.pageTitle = 'Add Recipe';
          } else {
            // Wrong state: Has no recipe id and is not new
            $state.go("recipes");
          }
        }
      })();

    }]);
})();
